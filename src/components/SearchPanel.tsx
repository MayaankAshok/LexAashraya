import { useState } from 'react';
import '../styles/SearchPanel.css';

interface SearchPanelProps {
  onSearch: (query: string) => void;
}

const SearchPanel = ({ onSearch }: SearchPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };
  return (
    <div className="search-panel">
      <h2>Legal Research</h2>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search laws, cases, regulations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-button">
          Search
        </button>
      </form>
        <div className="categories">
        <h3>Legal Practice Areas</h3>
        <ul>
          <li>Privacy & Data Protection</li>
          <li>Corporate Compliance</li>
          <li>Employment Law</li>
          <li>Intellectual Property</li>
          <li>Environmental Regulations</li>
          <li>Consumer Protection</li>
          <li>Constitutional Law</li>
        </ul>
      </div>

      <div className="recent-posts">
        <h3>Recent Updates</h3>
        <ul>
          <li>Data Privacy Act Commentary</li>
          <li>Smith v. Tech Giant Analysis</li>
          <li>Environmental Compliance Guide</li>
          <li>Remote Work Regulation FAQ</li>
        </ul>
      </div>
    </div>
  );
};

export default SearchPanel;
