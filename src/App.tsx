import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Link, NavLink } from 'react-router-dom'
import './styles/App.css'
import TagSearchPanel from './components/TagSearchPanel'
import BlogList from './components/BlogList'
import BlogPostDetail from './components/BlogPostDetail'
import PostEditor from './components/PostEditor'
import Disclaimer from './components/Disclaimer'
import type { BlogPostProps } from './types'
import { BlogServiceFactory } from './services/blogServiceFactory'
import { useHardRefresh } from './hooks/useHardRefresh'

function App() {
  const [blogPosts, setBlogPosts] = useState<BlogPostProps[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDisclaimer, setShowDisclaimer] = useState(true)
  const [searchInfo, setSearchInfo] = useState<{
    mode: 'all' | 'tag' | 'keyword' | 'combined';
    query?: string;
    tags?: string[];
  }>({ mode: 'all' })
  
  // Enable hard refresh with cache clearing via Ctrl+Shift+R
  useHardRefresh()
  
  // Function to handle disclaimer close
  const handleDisclaimerClose = () => {
    setShowDisclaimer(false)
    // Store current timestamp to track when disclaimer was accepted
    const now = new Date().getTime()
    localStorage.setItem('disclaimerAccepted', now.toString())
  }
  
  // Function to check if disclaimer should be shown (every 24 hours)
  const shouldShowDisclaimer = useCallback(() => {
    const lastAccepted = localStorage.getItem('disclaimerAccepted')
    if (!lastAccepted) {
      return true // Never accepted before
    }
    
    const lastAcceptedTime = parseInt(lastAccepted)
    const now = new Date().getTime()
    const twentyFourHours = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    
    return (now - lastAcceptedTime) >= twentyFourHours
  }, [])
  
  // Function to set posts from search results
  const setPosts = (posts: BlogPostProps[], searchMode: 'all' | 'tag' | 'keyword' | 'combined' = 'all', query?: string, tags?: string[]) => {
    setBlogPosts(posts)
    setSearchInfo({
      mode: searchMode,
      query,
      tags
    })
  }
  
  // Function to handle post changes (for admin mode)
  const handlePostChanged = () => {
    // Reload posts after any changes
    const reloadPosts = async () => {
      try {
        const result = await BlogServiceFactory.getAllPosts()
        setBlogPosts(result.posts)
        setSearchInfo(result.searchInfo)
      } catch (err) {
        console.error('Error reloading posts:', err)
      }
    }
    reloadPosts()
  }
  
  // Load blog posts when component mounts
  useEffect(() => {
    // Check if user needs to see the disclaimer (every 24 hours)
    setShowDisclaimer(shouldShowDisclaimer())
    
    const initializeApp = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Load posts directly from data/posts using static functionality
        const result = await BlogServiceFactory.getAllPosts()
        setBlogPosts(result.posts)
        setSearchInfo(result.searchInfo)
      } catch (err) {
        console.error('Error initializing app:', err)
        setError('Failed to load blog posts from data directory.')
      } finally {
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [shouldShowDisclaimer])

  return (
    <div className="app-container">
      <Disclaimer 
        isOpen={showDisclaimer} 
        onClose={handleDisclaimerClose} 
      />
      
      <header className="app-header">
        <Link to="/" className="title-link">
          <img src="/logo.svg" alt="LexAashraya Logo" className="header-logo" />
          <div className="header-text">
            <h1>LexAashraya</h1>
            <p className="header-tagline">Attorney-at-Law</p>
          </div>
        </Link>
        <nav className="header-nav" aria-label="Primary">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-tab${isActive ? ' nav-tab-active' : ''}`}
          >
            Knowledge base
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => `nav-tab${isActive ? ' nav-tab-active' : ''}`}
          >
            About me
          </NavLink>
        </nav>
        {BlogServiceFactory.shouldShowAdminUI() && (
          <div className="admin-controls">
            <Link to="/admin/posts" className="admin-link">Admin: Manage Posts</Link>
          </div>
        )}
      </header>
      
      <Routes>
        {/* Main route with the two-panel layout */}
        <Route path="/" element={
          <div className="blog-layout">
            <div className="left-panel">
              <TagSearchPanel onTagSearch={setPosts} />
            </div>
            <div className="main-panel">
              <BlogList 
                posts={blogPosts} 
                searchInfo={searchInfo}
                isLoading={isLoading} 
                error={error}
              />
            </div>
          </div>
        } />

        <Route path="/about" element={
          <div className="about-page">
            <section className="about-hero">
              <div className="about-hero-left">
                <img src="/headshot.png" alt="Adv. Ashok Sathyanathan" className="about-headshot" />
                <div className="about-hero-text">
                  <h2>(Adv.) Ashok Sathyanathan</h2>
                  <p className="about-role">Founder</p>
                </div>
              </div>
              <div className="about-hero-right">
                <div className="about-contact">
                  <div className="about-contact-item">
                    <span className="about-contact-label">Phone</span>
                    <span>+91 96197 87832</span>
                  </div>
                  <div className="about-contact-item">
                    <span className="about-contact-label">Email</span>
                    <span>ashok@lexaashraya.in</span>
                  </div>
                  <div className="about-contact-item">
                    <span className="about-contact-label">Address</span>
                    <span>3710 Rohini, Primal Revanta, LBS Marg, Mulund (W), Mumbai 400080.</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="about-section">
              <h3>About LexAashraya</h3>
              <p>
                LexAashraya is founded by Ashok Sathyanathan. The philosophy behind establishing this practice
                is to provide an Aashraya, a shelter or home, where you can connect with a professional who
                listens to you, understands your commercial needs, and provides guidance that serves your best
                interest. It specializes in the following matters:
              </p>
              <ul className="about-columns">
                <li>Corporate Law</li>
                <li>Commercial Transaction</li>
                <li>Banking and Finance</li>
                <li>Cross Border Transactions</li>
                <li>Due Diligence</li>
                <li>Regulatory Advisory</li>
                <li>Strategic Investments</li>
                <li>Employment Law</li>
                <li>Estate and Succession Planning</li>
                <li>Knowledge Management</li>
              </ul>
            </section>

            <section className="about-section">
              <h3>Personal Details of the Founder</h3>
              <ul className="about-list">
                <li>A practicing lawyer, with over 29+ years' experience.</li>
                <li>Registered with the Bar Council of Maharashtra and Goa.</li>
                <li>2025: Recognized by Legal500 Asia Pacific as a Recommended Lawyer</li>
                <li>
                  Expertise in
                  <ul>
                    <li>Strategizing</li>
                    <li>Negotiations</li>
                    <li>Drafting</li>
                    <li>Advisory</li>
                    <li>Risk Management</li>
                  </ul>
                </li>
                <li>
                  Over the years, the Founder has advised banks (PSU, Indian and Foreign), NBFCs, Financial
                  Services institutions, Corporates, LLPs and Partnership Firms and High Networth Individuals
                </li>
              </ul>
            </section>

            <section className="about-section">
              <h3>Areas of practice / professional experience</h3>
              <div className="about-grid">
                <div className="about-card">
                  <h4>Credit Transactions &amp; Debt Capital Market Transactions</h4>
                  <ul>
                    <li>Retail Lending</li>
                    <li>Corporate lending (bilateral, structured, consortium, etc.)</li>
                    <li>Digital / Electronic Transactions</li>
                    <li>Trade Finance products</li>
                    <li>Lease Rent Discounting</li>
                    <li>External Commercial Borrowings</li>
                    <li>Cross Border Financial Arrangements</li>
                    <li>Real Estate / Developer Finance</li>
                    <li>Acquisition Finance</li>
                    <li>Project Finance</li>
                    <li>Asset Finance</li>
                    <li>Asset Sell Down</li>
                    <li>Loan Restructuring</li>
                    <li>Issuance of Debentures (secured/unsecured, listed/unlisted) (convertible/non-convertible)</li>
                  </ul>
                </div>
                <div className="about-card">
                  <h4>Commercial Transactions</h4>
                  <ul>
                    <li>Business to Business (B2B) transaction agreements</li>
                    <li>Business to Customers (B2C) transaction agreements</li>
                    <li>Sourcing and Outsourcing Arrangements</li>
                    <li>Hardware and Software Development, Purchase, Licensing and Maintenance Arrangements</li>
                    <li>Marketing/Promotion Arrangements - Event Sponsorships, etc.</li>
                    <li>Real Estate - Leave and License or Leasing or Sale/Purchase Arrangements</li>
                    <li>Introducer/Referral Arrangements and Business Correspondent Arrangements</li>
                    <li>Preferred Financier Arrangements</li>
                    <li>Distribution relationships with Asset Management Companies, Alternate Investment Funds</li>
                    <li>Corporate Agency/Broking Arrangements with Insurance Companies</li>
                    <li>Technology Transfer</li>
                    <li>Trademark Licensing</li>
                    <li>Escrow Agreements - Cash/Documents/Assets/Source Codes</li>
                  </ul>
                </div>
              </div>
              <div className="about-grid">
                <div className="about-card">
                  <h4>Regulatory Advisory</h4>
                  <ul>
                    <li>RBI Regulations</li>
                    <li>FEMA, Rules and Regulations</li>
                    <li>Capital Market Regulations</li>
                  </ul>
                </div>
                <div className="about-card">
                  <h4>Securities Laws and Regulations</h4>
                  <ul>
                    <li>Portfolio Management Services</li>
                    <li>Broking and Services</li>
                    <li>Depository Services</li>
                    <li>Investment Management Services</li>
                    <li>Structured Investment Products</li>
                  </ul>
                </div>
              </div>
              <div className="about-grid">
                <div className="about-card">
                  <h4>Corporate Transactions</h4>
                  <ul>
                    <li>Private Equity and Venture Capital Investments (experience representing investor / promoter)</li>
                    <li>Business Transfers</li>
                    <li>Asset Sale and Purchases</li>
                    <li>Share Swaps</li>
                  </ul>
                </div>
                <div className="about-card">
                  <h4>Employment &amp; Labour Law Matters</h4>
                  <ul>
                    <li>
                      Matters relating to employment, termination, secondment or transfer of employees, contract
                      labour/outsourcing, ESOPs, etc.
                    </li>
                    <li>HR Policies including POSH, LCC and others</li>
                    <li>
                      Application of employment and social security related statutes relating to local Shops and
                      Establishment, Employee Provident Fund, Gratuity, and others
                    </li>
                  </ul>
                </div>
              </div>
              <div className="about-grid">
                <div className="about-card">
                  <h4>Due Diligence</h4>
                  <ul>
                    <li>Real Estate Due Diligence</li>
                    <li>Corporate Legal &amp; Secretarial Diligence</li>
                    <li>Litigation Due Diligence</li>
                    <li>Asset Tracing</li>
                    <li>Fraud Investigations</li>
                  </ul>
                </div>
                <div className="about-card">
                  <h4>Private Client Practice - Succession and Estate Planning</h4>
                  <ul>
                    <li>Trust documents</li>
                    <li>Testamentary documents (Wills)</li>
                    <li>Family / Business Arrangements</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="about-section">
              <h3>Past Transactional Experience</h3>
              <p>An illustrative list of past transactions advised by the Founder:</p>
              <div className="about-grid">
                <div className="about-card">
                  <h4>Banking and Finance</h4>
                  <ul>
                    <li>
                      Advised a large global multinational bank in India in relation to secured Rs. 450 crores green
                      loan facilities to Manvyata Promoters Private Limited at Bengaluru
                    </li>
                    <li>
                      Advised State Bank of India in relation to Rs. 775 crores secured LRD facilities to Yelakanai
                      Information Systems Private Limited
                    </li>
                    <li>
                      Advised LIC Housing Finance in relation to Rs. 350 crores secured credit facilities to Shubham
                      Housing Development Finance Company Limited
                    </li>
                    <li>
                      Advised Axis Bank in relation to construction finance sanctioned to Prestige Falcon Business
                      Parks
                    </li>
                    <li>
                      Advised LIC Housing Finance on over 10 secured developer finance lending arrangements
                      aggregating to INR 3000 crores
                    </li>
                    <li>
                      Advised IndusInd Bank on over 7 secured developer finance lending arrangements aggregating to
                      INR 1500 crores
                    </li>
                    <li>
                      Advised Bank of Baroda led consortium of lenders in a USD 750 million secured aircraft financing
                      arrangement
                    </li>
                    <li>
                      Retained legal counsel to Qatar National Bank, Doha Bank, Bank of China, DBS Bank and ENBD on
                      matters relating to their corporate lending business. Drafted their standard corporate lending
                      documents and advised on lending transactions for the last 4 years
                    </li>
                    <li>
                      Advised State Bank of India and RBL Bank on over 15 external commercial borrowing (ECB)
                      transactions through their GIFT City branch aggregating to over USD 250 million
                    </li>
                    <li>
                      Advised Herbert Smith Freehills on a USD 750 million overseas syndicated lending arrangement to
                      Yes Bank on matters relating to Indian law and security creation
                    </li>
                  </ul>
                </div>
                <div className="about-card">
                  <h4>General Commercial and Corporate matter</h4>
                  <ul>
                    <li>
                      Advised Commonwealth Bank of Australia in setting up their subsidiary in Bengaluru providing
                      shared services to CBA group worldwide on matters relating to commercial contracts with vendors
                      providing hardware and software, manpower and other services
                    </li>
                    <li>
                      Advised Detox group entity on submitting bids, collaboration, and joint venture arrangements in
                      relation to the solid waste management business. As on date, advised on 5 bids and related
                      arrangements
                    </li>
                    <li>
                      Advised AGS for all their hardware and software licensing and inter-connectivity contracts and
                      arrangements
                    </li>
                    <li>
                      Advised Barclays and other banks on the property leases and licensing arrangements for their
                      branch and office network
                    </li>
                    <li>
                      Advised Barclays and Doha Bank on their corporate insurance agency and distribution agreements
                    </li>
                    <li>
                      Advised Bank of China on their hardware and software purchasing and licensing agreements
                    </li>
                    <li>
                      Advised Barclays and ASK Group on their mutual funds' distribution agreements
                    </li>
                    <li>
                      Advised CCBA Shared Services on the following transactions:
                      <ol>
                        <li>Verizon Australia &amp; India - purchase of telecommunications hardware and maintenance services</li>
                        <li>
                          Ricoh Australia and India - purchase or leasing of hardware, software and maintenance
                          services relating to office electronics and imaging equipment
                        </li>
                        <li>Innova-Tech Consulting - audio-visual consulting services</li>
                        <li>
                          Intel Australia and India - purchase or leasing of hardware, software and maintenance services
                          relating to communication equipment
                        </li>
                      </ol>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="about-grid">
                <div className="about-card">
                  <h4>Debt Capital Market Transactions</h4>
                  <p>
                    Advised Home Credit on series of issuance of debt instruments viz. non-convertible debentures
                    and optionally convertible debentures by private and public listed companies secured by mortgage
                    and other assets aggregating to over INR 350 crores
                  </p>
                </div>
                <div className="about-card">
                  <h4>Succession and Estate Planning</h4>
                  <ul>
                    <li>
                      Principal legal counsel to Barclays Wealth India advised on various matters relating to succession
                      and estate planning
                    </li>
                    <li>
                      Advised various individuals and families on matters relating to succession and estate planning,
                      and business reconstitution
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="about-section">
              <div className="about-grid">
                <div className="about-card">
                  <h4>Strategic Investment related Transactions</h4>
                  <ul>
                    <li>
                      Advised the Promoters and other selling shareholders in a USD 48.6 million acquisition by shares
                      of Cosmos Entertainment, Singapore by NewQuest group entity from KKR group entity and the
                      Promoters and other Sellers
                    </li>
                    <li>
                      Advised the Promoters in a USD 50 million slump sale of business and sale of shares of Saurashtra
                      Enviro Projects, Gujarat to a France based MNC, Veolia Group
                    </li>
                    <li>
                      Advised on overseas and/or different domestic investments aggregating to USD 10 million.
                      Investments in the form of slump sale of business, equity and/or debt investment
                    </li>
                    <li>
                      Advised ITM Group on the restructuring and realignment of their group entities involving business
                      transfer and mergers
                    </li>
                  </ul>
                </div>
                <div className="about-card">
                  <h4>Employment &amp; Labour Law Matters</h4>
                  <ul>
                    <li>
                      Retained legal counsel to ASK Investment Group on HR related matters, including ESOPS, claw back
                      of bonus
                    </li>
                    <li>
                      Advised Zenith Systems on HR policies, employment related documents, ESOP scheme and other
                      related HR matters
                    </li>
                    <li>
                      Advised Scarecrow Communications (MN Saatchi group company) on employment related matters such
                      as termination, disciplinary actions
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="about-section">
              <h3>Professional Career Path</h3>
              <ul className="about-list">
                <li>
                  LexAashraya, Attorney-at-law (February 2025 to Present) - Founder - practicing banking and finance
                  practice, corporate and commercial law matters, employment law, private client practice, strategic
                  investments, and others
                </li>
                <li>
                  SNG &amp; Partners, Advocates and Solicitors, Mumbai (June 2017 to February 2025) - Partner,
                  co-leading the banking and finance practice, also practicing corporate and commercial law matters,
                  private client practice, strategic investments
                </li>
                <li>
                  Barclays Bank PLC,
                  <ul>
                    <li>
                      Singapore (June 2010 to December 2016) - Principal Legal Counsel to wealth management business
                      (trusteeship, succession and estate planning) in India and Singapore
                    </li>
                    <li>
                      Mumbai (April 2007 to June 2010) - Head of Legal for Commercial and Retail banking business and
                      subsidiaries
                    </li>
                  </ul>
                </li>
                <li>
                  Kochhar &amp; Co., Advocates and Solicitors, Mumbai (May 2006 to April 2007) - Senior Associate,
                  practiced Banking and Finance and corporate and commercial law matters
                </li>
                <li>
                  Standard Chartered Bank PLC, Mumbai (April 2004 to April 2006) - Associate Manager (Legal) -
                  advised the commercial and retail banking business, and on all other matters of law and policy in
                  relation to that business
                </li>
                <li>
                  ICICI Bank Limited, Mumbai (January 2003 to March 2004) - Manager (Legal) - advised the retail
                  mortgage-backed lending business, and on all other matters of law and policy in relation to that
                  business
                </li>
                <li>
                  National Securities Depository Limited, Mumbai (July 1999 to January 2003) - Assistant Manager
                  (Legal) - advised the commercial and operational matters relating to the business of the company
                </li>
                <li>
                  Greaves Limited, Mumbai (February 1997 to June 1999) - Officer (Secretarial) - advised on the
                  company and its subsidiaries on corporate secretarial matters function and embedded effective
                  corporate governance standards
                </li>
              </ul>
            </section>
          </div>
        } />
        
        {/* Detail view route for a specific post */}
        <Route path="/post/:id" element={<BlogPostDetail />} />
        
        {/* Admin routes - always available but link only shown when shouldShowAdminUI is true */}
        <Route path="/admin/posts" element={
          <PostEditor 
            onPostSaved={handlePostChanged}
            onPostDeleted={handlePostChanged}
          />
        } />
        <Route path="/admin/posts/new" element={
          <PostEditor 
            isNew={true}
            onPostSaved={handlePostChanged}
            onPostDeleted={handlePostChanged}
          />
        } />
        <Route path="/admin/posts/edit/:id" element={
          <PostEditor 
            onPostSaved={handlePostChanged}
            onPostDeleted={handlePostChanged}
          />
        } />
      </Routes>
    </div>
  )
}

export default App
