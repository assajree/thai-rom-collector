export type SidebarLinkSection = 'systems' | 'translators' | 'tags' | 'other';

export interface SidebarLink {
  id: string;
  label: string;
  articleSlug: string;
  section: SidebarLinkSection;
}
