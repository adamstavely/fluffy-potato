export type ToolCategory =
  | 'language'
  | 'data'
  | 'identity'
  | 'financial'
  | 'productivity';

export type ChangelogBump = 'major' | 'minor' | 'patch';

export type Party = 'first_party' | 'third_party';

export interface MaintainerInfo {
  teamName: string;
  party: Party;
  contact: string;
  slackChannel?: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  bump: ChangelogBump;
  notes: string[];
}

export interface ToolDefinition {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  version: string;
  category: ToolCategory;
  /** Lucide icon name (PascalCase), e.g. Wrench */
  icon: string;
  featureFlag?: string;
  launchUrl: string;
  maintainer: MaintainerInfo;
  changelog: ChangelogEntry[];
  accessLevel: string;
  auditLogEnabled: boolean;
}

export interface ToolScaffoldConfig {
  toolId: string;
  toolName: string;
  version: string;
  featureFlag?: string;
}

export const TOOL_CATEGORY_LABEL: Record<ToolCategory, string> = {
  language: 'Language',
  data: 'Data',
  identity: 'Identity',
  financial: 'Financial',
  productivity: 'Productivity',
};

export const TOOL_CATEGORY_ORDER: ToolCategory[] = [
  'language',
  'data',
  'identity',
  'financial',
  'productivity',
];
