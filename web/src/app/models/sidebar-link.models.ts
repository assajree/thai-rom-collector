export type SidebarLinkSection = 'systems' | 'translators' | 'tags' | 'other';
export type SidebarLinkType = 'article' | 'external';

export interface SidebarLink {
  id: string;
  label: string;
  type: SidebarLinkType;
  articleSlug: string;
  url: string;
  section: SidebarLinkSection;
}
