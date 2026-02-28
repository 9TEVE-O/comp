import { analyzePolicyText } from '@comp/utils/policy-analyzer';
import { env } from '@/env.mjs';
import { db, Prisma } from '@db';
import { logger, schemaTask } from '@trigger.dev/sdk';
import { z } from 'zod';

const firecrawlScrapeResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      markdown: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

/**
 * Fetches a vendor's privacy policy or terms of service page using Firecrawl,
 * then analyzes the text using the PolicyAnalyzer (ported from 9TEVE-O/AI-Policy-Terms-Analyzer)
 * to extract tech stack, third-party services, API references, and data sharing info.
 * Results are stored in GlobalVendors.policyAnalysisData.
 */
export const analyzeVendorPolicy = schemaTask({
  id: 'analyze-vendor-policy',
  schema: z.object({
    website: z.string().url(),
  }),
  maxDuration: 1000 * 60 * 5, // 5 minutes
  run: async ({ website }) => {
    logger.info('Starting vendor policy analysis', { website });

    const vendor = await db.globalVendors.findFirst({
      where: { website },
      select: {
        company_name: true,
        privacy_policy_url: true,
        terms_of_service_url: true,
      },
    });

    if (!vendor) {
      logger.warn('Vendor not found in GlobalVendors', { website });
      return { success: false, error: 'Vendor not found' };
    }

    const policyUrl = vendor.privacy_policy_url || vendor.terms_of_service_url;
    if (!policyUrl) {
      logger.info('No policy URL available for vendor', { website });
      return { success: false, error: 'No policy URL found for vendor' };
    }

    logger.info('Fetching policy document', { policyUrl });

    let policyText: string;
    try {
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.FIRECRAWL_API_KEY}`,
        },
        body: JSON.stringify({
          url: policyUrl,
          formats: ['markdown'],
          onlyMainContent: true,
          removeBase64Images: true,
        }),
      });

      const scrapeData = await scrapeResponse.json();
      logger.debug('Firecrawl scrape response', { scrapeData });

      const parsed = firecrawlScrapeResponseSchema.safeParse(scrapeData);
      if (!parsed.success || !parsed.data.data) {
        logger.error('Failed to scrape policy page', { policyUrl, error: parsed.error?.issues });
        return { success: false, error: 'Failed to scrape policy page' };
      }

      policyText = parsed.data.data.markdown || '';
    } catch (error: any) {
      logger.error('Error scraping policy page', { policyUrl, error: error.message });
      return { success: false, error: error.message || 'Failed to scrape policy page' };
    }

    if (!policyText.trim()) {
      logger.warn('Empty policy text returned', { policyUrl });
      return { success: false, error: 'Empty policy text returned from scrape' };
    }

    const analysisResult = analyzePolicyText(policyText, vendor.company_name ?? undefined);
    logger.info('Policy analysis complete', {
      website,
      urlsFound: analysisResult.urls_found.length,
      thirdPartyServices: analysisResult.third_party_services.length,
    });

    await db.globalVendors.update({
      where: { website },
      data: {
        policyAnalysisData: analysisResult as unknown as Prisma.InputJsonValue,
        policyAnalysisUpdatedAt: new Date(),
      },
    });

    logger.info('Policy analysis stored', { website });
    return { success: true, data: analysisResult };
  },
});
