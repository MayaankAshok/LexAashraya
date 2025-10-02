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
          <h2>LexAashraya - Legal Disclaimer </h2>
        </div>
        <div className="disclaimer-content">
          <p>
            The Bar Council of India does not permit advertisement or solicitation by advocates in any form or manner. By accessing this website, www.lexaashraya.in, you acknowledge and confirm that you are seeking information relating to LexAashraya and its representatives of your own accord and that there has been no form of solicitation, advertisement or inducement by LexAashraya and its representatives.
          </p>
          <p>
            The content of this website is for informational purposes only and should not be interpreted as soliciting or advertisement. No material/information provided on this website should be construed as legal advice. LexAashraya and its representatives shall not be liable for consequences of any action taken by relying on the material/information provided on this website.
          </p>
          <p>
            The contents of this website are the intellectual property of LexAashraya.
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
