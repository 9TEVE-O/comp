/**
 * Policy and Terms Analyzer
 *
 * Analyzes companies' policies, terms and conditions, and privacy policies
 * to extract technical information including:
 * - Websites and domains referenced
 * - Technologies and platforms mentioned
 * - Third-party services and integrations
 * - API and automation references
 * - Data sharing practices
 *
 * Ported from 9TEVE-O/AI-Policy-Terms-Analyzer (Python) to TypeScript.
 */

export interface TechnologiesDetected {
  platforms: string[];
  languages: string[];
  frameworks: string[];
  databases: string[];
  services: string[];
  ai_ml: string[];
  bots: string[];
}

export interface GcpInfo {
  services: string[];
  programs: string[];
  certifications: string[];
}

export interface PolicyAnalysisResult {
  company_name: string;
  analyzed_at: string;
  document_length: number;
  word_count: number;
  urls_found: string[];
  domains_found: string[];
  emails_found: string[];
  technologies_detected: TechnologiesDetected;
  google_cloud_info: GcpInfo;
  third_party_services: string[];
  api_references: string[];
  data_sharing_mentions: string[];
}

const TECH_KEYWORDS: Record<keyof TechnologiesDetected, string[]> = {
  platforms: [
    'github',
    'gitlab',
    'bitbucket',
    'aws',
    'azure',
    'heroku',
    'netlify',
    'vercel',
    'cloudflare',
    'firebase',
  ],
  languages: [
    'python',
    'javascript',
    'java',
    'ruby',
    'php',
    'go',
    'rust',
    'typescript',
    'c++',
    'c#',
    'swift',
    'kotlin',
  ],
  frameworks: [
    'react',
    'angular',
    'vue',
    'django',
    'flask',
    'express',
    'spring',
    'rails',
    'laravel',
    'nextjs',
    'nuxt',
    'svelte',
  ],
  databases: [
    'mysql',
    'postgresql',
    'mongodb',
    'redis',
    'elasticsearch',
    'dynamodb',
    'cassandra',
    'sqlite',
    'oracle',
    'sql server',
  ],
  services: [
    'stripe',
    'paypal',
    'twilio',
    'sendgrid',
    'mailchimp',
    'zendesk',
    'intercom',
    'segment',
    'analytics',
    'google analytics',
    'mixpanel',
  ],
  ai_ml: [
    'openai',
    'chatgpt',
    'gpt',
    'claude',
    'gemini',
    'machine learning',
    'artificial intelligence',
    'neural network',
    'deep learning',
    'nlp',
  ],
  bots: ['chatbot', 'bot', 'automated system', 'automation', 'crawler', 'spider'],
};

const GCP_SERVICES = [
  'google cloud platform',
  'gcp',
  'google cloud',
  'cloud functions',
  'cloud run',
  'cloud storage',
  'bigquery',
  'cloud sql',
  'app engine',
  'compute engine',
  'kubernetes engine',
  'gke',
  'cloud vision',
  'cloud speech',
  'cloud translation',
  'cloud natural language',
  'vertex ai',
  'cloud firestore',
  'cloud pubsub',
  'cloud dataflow',
  'cloud composer',
  'cloud build',
  'artifact registry',
  'cloud cdn',
  'cloud dns',
  'cloud armor',
  'cloud load balancing',
  'cloud iam',
  'cloud logging',
  'cloud monitoring',
  'cloud trace',
  'cloud profiler',
  'cloud debugger',
];

const GCP_PROGRAMS = [
  'google cloud developer',
  'google cloud innovator',
  'gcp developer',
  'gcp innovator',
  'cloud developer program',
  'cloud innovator program',
  'google developer program',
  'google innovator program',
];

const GCP_CERT_PATTERNS = [
  /google cloud\s+(?:certified\s+)?(?:professional|associate)?\s*(?:cloud\s+)?(?:architect|developer|engineer|data\s+engineer)/gi,
  /gcp\s+(?:certified\s+)?(?:professional|associate)?\s*(?:architect|developer|engineer)/gi,
  /google\s+(?:certified\s+)?(?:professional|associate)?\s*cloud/gi,
];

const URL_RE =
  /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_+.~#?&/=]*/gi;
const DOMAIN_RE = /\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b/g;
const VERSION_RE = /^[v]?\d+\.\d+/i;
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const API_RE = /\b(?:API|REST|GraphQL|webhook|endpoint)s?\b/gi;
const SERVICE_RES = [
  /third[- ]party\s+(?:service|provider|platform)s?:?\s*([^\n.]+)/gi,
  /we\s+(?:use|utilize|employ)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(?:for|to)/g,
  /powered\s+by\s+([A-Z][a-zA-Z]+)/gi,
];
const SHARING_RES = [
  /(?:share|transfer|disclose|provide)[\s\S]{0,200}?(?:data|information)[\s\S]{0,200}?(?:with|to)\s+([^\n.]+)/gi,
  /(?:integrate|integration|connected|connection)\s+(?:with|to)\s+([^\n.]+)/gi,
];

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function extractUrls(text: string): string[] {
  return unique(Array.from(text.matchAll(URL_RE), (m) => m[0]));
}

function extractDomains(text: string): string[] {
  const domains = Array.from(text.matchAll(DOMAIN_RE), (m) => m[0]);
  return unique(domains.filter((d) => !VERSION_RE.test(d)));
}

function extractEmails(text: string): string[] {
  return unique(Array.from(text.matchAll(EMAIL_RE), (m) => m[0]));
}

function detectTechnologies(text: string): TechnologiesDetected {
  const lower = text.toLowerCase();
  const result = {} as TechnologiesDetected;
  for (const [category, keywords] of Object.entries(TECH_KEYWORDS) as [
    keyof TechnologiesDetected,
    string[],
  ][]) {
    result[category] = keywords.filter((kw) => lower.includes(kw));
  }
  return result;
}

function detectGcpInfo(text: string): GcpInfo {
  const lower = text.toLowerCase();
  const services = GCP_SERVICES.filter((s) => lower.includes(s));
  const programs = GCP_PROGRAMS.filter((p) => lower.includes(p));
  const certifications: string[] = [];
  for (const pattern of GCP_CERT_PATTERNS) {
    const matches = Array.from(text.matchAll(new RegExp(pattern.source, pattern.flags)));
    certifications.push(...matches.map((m) => m[0].trim()));
  }
  return { services, programs, certifications: unique(certifications) };
}

function extractThirdPartyServices(text: string): string[] {
  const found: string[] = [];
  for (const re of SERVICE_RES) {
    const matches = Array.from(text.matchAll(new RegExp(re.source, re.flags)));
    found.push(...matches.map((m) => m[1]?.trim()).filter(Boolean));
  }
  return unique(found);
}

function extractApiReferences(text: string): string[] {
  const apiMatches = Array.from(text.matchAll(new RegExp(API_RE.source, 'gi')));
  const refs: string[] = [];
  for (const match of apiMatches) {
    const idx = match.index ?? 0;
    refs.push(text.slice(Math.max(0, idx - 30), idx + 50).replace(/\s+/g, ' ').trim());
  }
  return unique(refs).slice(0, 20);
}

function extractDataSharingMentions(text: string): string[] {
  const found: string[] = [];
  for (const re of SHARING_RES) {
    const matches = Array.from(text.matchAll(new RegExp(re.source, re.flags)));
    found.push(...matches.map((m) => m[1]?.trim()).filter(Boolean));
  }
  return unique(found).slice(0, 20);
}

/**
 * Analyzes a policy document and returns structured extraction results.
 * Mirrors the `PolicyAnalyzer.analyze()` method from 9TEVE-O/AI-Policy-Terms-Analyzer.
 */
export function analyzePolicyText(
  text: string,
  companyName = 'Unknown Company',
): PolicyAnalysisResult {
  return {
    company_name: companyName,
    analyzed_at: new Date().toISOString(),
    document_length: text.length,
    word_count: text.split(/\s+/).filter(Boolean).length,
    urls_found: extractUrls(text),
    domains_found: extractDomains(text),
    emails_found: extractEmails(text),
    technologies_detected: detectTechnologies(text),
    google_cloud_info: detectGcpInfo(text),
    third_party_services: extractThirdPartyServices(text),
    api_references: extractApiReferences(text),
    data_sharing_mentions: extractDataSharingMentions(text),
  };
}
