import { storyTabs, type StoryTab } from '@/content/pages/stories';

type StoryTabsProps = {
  activeTab: StoryTab;
  onChange: (tab: StoryTab) => void;
};

export function StoryTabs({ activeTab, onChange }: StoryTabsProps) {
  return (
    <div className="nl-story-tabs" role="tablist" aria-label="Filter stories">
      {storyTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`nl-story-tab${activeTab === tab.id ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
