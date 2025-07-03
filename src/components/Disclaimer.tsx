import '../styles/Disclaimer.css';

interface DisclaimerProps {
  isOpen: boolean;
  onClose: () => void;
}

const Disclaimer = ({ isOpen, onClose }: DisclaimerProps) => {
  if (!isOpen) return null;

  return (
    <div className="disclaimer-overlay">
      <div className="disclaimer-modal">
        <div className="disclaimer-header">
          <h2>Important Disclaimer</h2>
        </div>
        <div className="disclaimer-content">
          <p>
            <strong>Legal Disclaimer:</strong> The information provided on this website is for general informational purposes only and does not constitute legal advice.
          </p>
          <p>
            The content on this site should not be relied upon as a substitute for professional legal counsel. Laws and regulations vary by jurisdiction and are subject to change.
          </p>
          <p>
            <strong>No Attorney-Client Relationship:</strong> Use of this website does not create an attorney-client relationship between you and any legal professional associated with this site.
          </p>
          <p>
            <strong>Accuracy:</strong> While we strive to provide accurate and up-to-date information, we make no representations or warranties regarding the completeness, accuracy, or reliability of any information on this site.
          </p>
          <p>
            For specific legal advice regarding your situation, please consult with a qualified attorney in your jurisdiction.
          </p>
        </div>
        <div className="disclaimer-footer">
          <button 
            className="disclaimer-ok-button" 
            onClick={onClose}
            autoFocus
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;
