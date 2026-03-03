import { describe, expect, it } from 'vitest';
import { analyzePolicyText } from '@comp/utils/policy-analyzer';

const SAMPLE_POLICY = `
Privacy Policy for TechCorp Inc.

We use GitHub for code hosting and AWS for cloud infrastructure. Our chatbot is
powered by OpenAI's GPT technology. We integrate with Stripe for payments and
SendGrid for email delivery.

Google Cloud Platform services are also used for some data processing, including
Cloud Functions and BigQuery for analytics. We participate in the Google Cloud
Developer program.

For more information, visit https://techcorp.com/privacy or contact
privacy@techcorp.com

Third-party services: We use Google Analytics, Mixpanel for analytics.

Our REST API connects to various services. We use a webhook for real-time updates.

We may share your data with our partners to provide our services.
`;

describe('analyzePolicyText', () => {
  it('returns basic document stats', () => {
    const result = analyzePolicyText(SAMPLE_POLICY, 'TechCorp Inc.');
    expect(result.company_name).toBe('TechCorp Inc.');
    expect(result.document_length).toBeGreaterThan(0);
    expect(result.word_count).toBeGreaterThan(0);
    expect(result.analyzed_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('extracts URLs', () => {
    const result = analyzePolicyText(SAMPLE_POLICY);
    expect(result.urls_found).toContain('https://techcorp.com/privacy');
  });

  it('extracts email addresses', () => {
    const result = analyzePolicyText(SAMPLE_POLICY);
    expect(result.emails_found).toContain('privacy@techcorp.com');
  });

  it('detects cloud platform technologies', () => {
    const result = analyzePolicyText(SAMPLE_POLICY);
    expect(result.technologies_detected.platforms).toContain('github');
    expect(result.technologies_detected.platforms).toContain('aws');
  });

  it('detects AI/ML technologies', () => {
    const result = analyzePolicyText(SAMPLE_POLICY);
    expect(result.technologies_detected.ai_ml).toContain('openai');
    expect(result.technologies_detected.ai_ml).toContain('chatgpt');
  });

  it('detects third-party services', () => {
    const result = analyzePolicyText(SAMPLE_POLICY);
    expect(result.technologies_detected.services).toContain('stripe');
    expect(result.technologies_detected.services).toContain('sendgrid');
  });

  it('detects Google Cloud services', () => {
    const result = analyzePolicyText(SAMPLE_POLICY);
    expect(result.google_cloud_info.services).toContain('google cloud platform');
    expect(result.google_cloud_info.services).toContain('cloud functions');
    expect(result.google_cloud_info.services).toContain('bigquery');
  });

  it('detects Google Cloud developer programs', () => {
    const result = analyzePolicyText(SAMPLE_POLICY);
    expect(result.google_cloud_info.programs).toContain('google cloud developer');
  });

  it('detects API references', () => {
    const result = analyzePolicyText(SAMPLE_POLICY);
    expect(result.api_references.length).toBeGreaterThan(0);
    expect(result.api_references.some((r) => /REST|webhook/i.test(r))).toBe(true);
  });

  it('detects data sharing mentions', () => {
    const result = analyzePolicyText(SAMPLE_POLICY);
    expect(result.data_sharing_mentions.length).toBeGreaterThan(0);
  });

  it('deduplicates results', () => {
    const repeated = SAMPLE_POLICY + SAMPLE_POLICY;
    const result = analyzePolicyText(repeated);
    const urlSet = new Set(result.urls_found);
    expect(urlSet.size).toBe(result.urls_found.length);
  });

  it('uses default company name when not provided', () => {
    const result = analyzePolicyText('Some policy text.');
    expect(result.company_name).toBe('Unknown Company');
  });
});
