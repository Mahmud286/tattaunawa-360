
import React, { useState } from 'react';
import { APP_NAME, FOOTER_COPY, MOCK_CONSULTANTS, TAGLINE, SUPPORTED_LANGUAGES, TRANSLATIONS } from './constants';
import { ViewState, Consultant, ExpertCategory } from './types';
import ChatWidget from './components/ChatWidget';
import ConsultantCard from './components/ConsultantCard';
import VideoModal from './components/VideoModal';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedExpertId, setSelectedExpertId] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [regionQuery, setRegionQuery] = useState(''); // New state for region search
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('EN');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  // Translation Helper
  const t = (key: string) => {
    return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['EN'][key] || key;
  };

  // Dynamic Global Search Logic
  // If local search fails, we generate "Global" results based on the query
  const getDisplayConsultants = () => {
    // 1. Local Filter
    const localMatches = MOCK_CONSULTANTS.filter(c => {
      const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.bio.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // 2. If local matches exist, return them
    if (localMatches.length > 0 || searchQuery.length < 2) {
      return { consultants: localMatches, source: 'local' };
    }

    // 3. If no local matches, generate "Global/External" results based on the search query
    // This simulates searching a wider web directory
    const globalResults: Consultant[] = [
      {
        id: `global-1-${searchQuery}`,
        name: 'Alex Thompson',
        title: `Professional ${searchQuery} Specialist`, // Dynamically uses the search term
        category: 'Business & Legal Advisory', // Fallback category
        bio: `Experienced ${searchQuery} professional located in New York. Identified via global web search.`,
        avatarUrl: `https://picsum.photos/seed/${searchQuery}1/200/200`,
        hourlyRate: 0, // Unknown for external
        currency: 'USD',
        languages: ['English'],
        experienceYears: 5,
        rating: 0,
        reviewCount: 0,
        verified: false, // Mark as unverified/external
        availability: ['Mon-Fri'],
        location: 'New York, USA',
        reviews: []
      },
      {
        id: `global-2-${searchQuery}`,
        name: 'Maria Garcia',
        title: `Senior ${searchQuery} Consultant`,
        category: 'Design, Arts & Creativity',
        bio: `Top-rated ${searchQuery} expert with international experience.`,
        avatarUrl: `https://picsum.photos/seed/${searchQuery}2/200/200`,
        hourlyRate: 0,
        currency: 'USD',
        languages: ['English', 'Spanish'],
        experienceYears: 8,
        rating: 0,
        reviewCount: 0,
        verified: false,
        availability: ['Weekends'],
        location: 'Madrid, Spain',
        reviews: []
      },
      {
        id: `global-3-${searchQuery}`,
        name: 'Wei Chen',
        title: `Certified ${searchQuery}`,
        category: 'Programming & Tech',
        bio: `Specialized in ${searchQuery} services and consulting.`,
        avatarUrl: `https://picsum.photos/seed/${searchQuery}3/200/200`,
        hourlyRate: 0,
        currency: 'USD',
        languages: ['English', 'Mandarin'],
        experienceYears: 12,
        rating: 0,
        reviewCount: 0,
        verified: false,
        availability: ['Mon', 'Wed', 'Fri'],
        location: 'Shanghai, China',
        reviews: []
      }
    ];

    return { consultants: globalResults, source: 'global' };
  };

  const { consultants: displayConsultants, source: dataSource } = getDisplayConsultants();

  // Region specific filtering
  const getRegionConsultants = () => {
     if (!regionQuery) return MOCK_CONSULTANTS;
     return MOCK_CONSULTANTS.filter(c => 
        (c.location?.toLowerCase().includes(regionQuery.toLowerCase()))
     );
  };

  const regionConsultants = getRegionConsultants();
  
  // Extract unique locations for the dropdown
  const uniqueLocations = Array.from(new Set(MOCK_CONSULTANTS.map(c => c.location).filter(Boolean))).sort();

  const handleViewExpert = (id: string) => {
    setSelectedExpertId(id);
    setView('PROFILE');
    window.scrollTo(0,0);
    setIsMobileMenuOpen(false);
  };

  const handleBookSession = () => {
    // In a real app, this would open a calendar or payment flow
    setShowVideoModal(true); 
  };

  const handleNavClick = (newView: ViewState) => {
    setView(newView);
    window.scrollTo(0,0);
    setIsMobileMenuOpen(false);
  };

  // Helper to find expert across both lists for the profile view
  const getExpertForProfile = () => {
    const local = MOCK_CONSULTANTS.find(c => c.id === selectedExpertId);
    if (local) return local;
    
    // If not local, try to find it in the generated list (re-generating briefly for display consistency)
    const globalList = getDisplayConsultants().consultants;
    return globalList.find(c => c.id === selectedExpertId);
  };

  const selectedExpert = getExpertForProfile();
  const categories = ['All', ...Array.from(new Set(MOCK_CONSULTANTS.map(c => c.category)))];

  // --- SUB-COMPONENTS (Refactored to render functions to avoid focus loss) ---

  const renderNavbar = () => (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => handleNavClick('HOME')}>
            <div className="bg-blue-600 text-white p-2 rounded-lg mr-2 font-bold text-xl">T360</div>
            <span className="font-bold text-xl text-slate-800 tracking-tight hidden sm:inline">{APP_NAME}</span>
            <span className="font-bold text-xl text-slate-800 tracking-tight sm:hidden">Tattaunawa</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => handleNavClick('HOME')} className={`text-sm font-medium ${view === 'HOME' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>{t('home')}</button>
            <button onClick={() => handleNavClick('BROWSE')} className={`text-sm font-medium ${view === 'BROWSE' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>{t('findExpert')}</button>
            <button onClick={() => handleNavClick('REGION')} className={`text-sm font-medium ${view === 'REGION' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>{t('region')}</button>
            <button onClick={() => handleNavClick('DASHBOARD')} className={`text-sm font-medium ${view === 'DASHBOARD' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>{t('dashboard')}</button>
          </div>

          <div className="flex items-center space-x-4">
             {/* Language Dropdown */}
             <div className="relative">
               <button 
                 onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                 className="hidden lg:flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium px-2 py-1 rounded hover:bg-slate-50"
               >
                 <span>{SUPPORTED_LANGUAGES.find(l => l.code === currentLang)?.flag}</span>
                 <span>{currentLang}</span>
                 <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
               </button>
               
               {isLangMenuOpen && (
                 <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsLangMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-20 py-1 max-h-64 overflow-y-auto">
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => { setCurrentLang(lang.code); setIsLangMenuOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-slate-50 ${currentLang === lang.code ? 'bg-blue-50 text-blue-600' : 'text-slate-700'}`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span>{lang.name}</span>
                        {currentLang === lang.code && <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                      </button>
                    ))}
                  </div>
                 </>
               )}
             </div>

             <button className="hidden md:block bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
               {t('signIn')}
             </button>

             {/* Mobile Menu Button */}
             <div className="flex items-center md:hidden">
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-slate-500 hover:text-slate-900 p-2"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 py-2 px-4 space-y-2 shadow-lg absolute w-full left-0 animate-in slide-in-from-top-2 duration-200 z-50">
          <button onClick={() => handleNavClick('HOME')} className={`block w-full text-left py-3 px-3 rounded-md text-base font-medium ${view === 'HOME' ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}>{t('home')}</button>
          <button onClick={() => handleNavClick('BROWSE')} className={`block w-full text-left py-3 px-3 rounded-md text-base font-medium ${view === 'BROWSE' ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}>{t('findExpert')}</button>
          <button onClick={() => handleNavClick('REGION')} className={`block w-full text-left py-3 px-3 rounded-md text-base font-medium ${view === 'REGION' ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}>{t('region')}</button>
          <button onClick={() => handleNavClick('DASHBOARD')} className={`block w-full text-left py-3 px-3 rounded-md text-base font-medium ${view === 'DASHBOARD' ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}>{t('dashboard')}</button>
          
          <div className="border-t border-slate-100 pt-3 mt-2">
             <div className="text-xs text-slate-400 font-bold mb-2 uppercase px-3">Select Language</div>
             <div className="grid grid-cols-2 gap-2 mb-4">
               {SUPPORTED_LANGUAGES.map(lang => (
                 <button 
                  key={lang.code}
                  onClick={() => setCurrentLang(lang.code)}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${currentLang === lang.code ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-600'}`}
                 >
                   <span>{lang.flag}</span>
                   <span>{lang.name}</span>
                 </button>
               ))}
             </div>
            <button className="w-full bg-slate-900 text-white px-4 py-3 rounded-lg text-sm font-medium">{t('signIn')}</button>
          </div>
        </div>
      )}
    </nav>
  );

  const renderHero = () => (
    <div className="relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32 pt-10 sm:pt-20 px-4 sm:px-6 lg:px-8">
          <main className="mt-8 mx-auto max-w-7xl sm:mt-12 md:mt-16 lg:mt-20 xl:mt-28">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-slate-900 sm:text-5xl md:text-6xl">
                <span className="block xl:inline">{t('heroTitle')}</span>{' '}
                <span className="block text-blue-600 xl:inline">{t('heroSubtitle')}</span>
              </h1>
              <p className="mt-3 text-base text-slate-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                {currentLang === 'EN' ? TAGLINE : t('welcome')} {t('heroDesc')}
              </p>
              <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row sm:justify-center lg:justify-start gap-3">
                <div className="rounded-md shadow">
                  <button onClick={() => handleNavClick('BROWSE')} className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
                    {t('findExpert')}
                  </button>
                </div>
                <div className="mt-0 sm:ml-0">
                  <button className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10">
                    {t('joinExpert')}
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <img className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full" src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2850&q=80" alt="Team meeting" />
      </div>
    </div>
  );

  const renderBrowseSection = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
           <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{t('browseTitle')}</h2>
           {dataSource === 'local' ? (
             <p className="text-slate-500 mt-1 text-sm sm:text-base">Found {displayConsultants.length} professionals matching your criteria</p>
           ) : (
             <p className="text-orange-600 mt-1 text-sm sm:text-base font-medium">
               No local matches found. Showing global results for "{searchQuery}".
             </p>
           )}
        </div>
        
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input 
            type="text" 
            placeholder={t('searchPlaceholder')}
            className="w-full sm:w-64 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select 
            className="w-full sm:w-auto border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayConsultants.map(consultant => (
          <ConsultantCard 
            key={consultant.id} 
            consultant={consultant} 
            onViewProfile={handleViewExpert} 
          />
        ))}
        {displayConsultants.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
             <p className="text-slate-500 text-lg">No experts found matching your criteria.</p>
             <button onClick={() => {setSelectedCategory('All'); setSearchQuery('');}} className="mt-4 text-blue-600 font-medium hover:underline">{t('clearFilters')}</button>
          </div>
        )}
      </div>
    </div>
  );

  const renderRegionSection = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Region Header */}
      <div className="bg-blue-600 rounded-2xl p-6 sm:p-10 text-white mb-10 relative overflow-hidden">
         <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-bold mb-4">{t('regionTitle')}</h2>
            <p className="text-blue-100 text-lg mb-6">{t('regionSubtitle')}</p>
            
            <div className="relative">
              <select 
                 className="w-full rounded-lg px-5 py-3 text-slate-900 focus:ring-4 focus:ring-blue-400 focus:outline-none shadow-lg appearance-none cursor-pointer"
                 value={regionQuery}
                 onChange={(e) => setRegionQuery(e.target.value)}
              >
                <option value="">{t('regionPlaceholder')}</option>
                {uniqueLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <div className="absolute right-2 top-2 bg-blue-100 text-blue-600 p-1.5 rounded-md pointer-events-none">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                 </svg>
              </div>
            </div>
         </div>
         {/* Decorative circle */}
         <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Results */}
      <div>
         <div className="flex justify-between items-end mb-6">
           <h3 className="text-xl font-bold text-slate-900">
              {regionQuery ? `Results for "${regionQuery}"` : "All Regional Experts"}
           </h3>
           <span className="text-sm text-slate-500">{regionConsultants.length} Found</span>
         </div>

         {regionConsultants.length > 0 ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {regionConsultants.map(consultant => (
               <ConsultantCard 
                 key={consultant.id} 
                 consultant={consultant} 
                 onViewProfile={handleViewExpert} 
               />
             ))}
           </div>
         ) : (
           <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
             <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
               <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
               </svg>
             </div>
             <p className="text-slate-600 font-medium mb-2">{t('noRegionResults')}</p>
             <button onClick={() => setView('BROWSE')} className="text-blue-600 font-bold hover:underline">
               Try Global Search
             </button>
           </div>
         )}
      </div>
    </div>
  );

  const renderProfileView = () => {
    if (!selectedExpert) return null;
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <button onClick={() => handleNavClick(view === 'REGION' ? 'REGION' : 'BROWSE')} className="mb-6 flex items-center text-slate-500 hover:text-blue-600 transition-colors">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to List
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className={`h-32 sm:h-48 bg-gradient-to-r ${selectedExpert.verified ? 'from-blue-600 to-slate-800' : 'from-slate-400 to-slate-600'}`}></div>
          <div className="px-4 sm:px-8 pb-8">
            {/* Header Section: Avatar and Actions */}
            <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-12 sm:-mt-16 mb-6">
              <img 
                src={selectedExpert.avatarUrl} 
                alt={selectedExpert.name} 
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-md object-cover mb-4 sm:mb-0" 
              />
              <div className="flex w-full sm:w-auto gap-3 sm:mb-2">
                 <button className="flex-1 sm:flex-none bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 text-center">Message</button>
                 {selectedExpert.verified ? (
                   <button onClick={handleBookSession} className="flex-1 sm:flex-none bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 text-center text-sm sm:text-base whitespace-nowrap">
                     Book (${selectedExpert.hourlyRate}/hr)
                   </button>
                 ) : (
                   <button onClick={() => alert("This request has been sent to the expert. They will contact you if interested.")} className="flex-1 sm:flex-none bg-slate-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-900 shadow-lg text-center text-sm sm:text-base whitespace-nowrap">
                     Invite to Join
                   </button>
                 )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                 <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
                      {selectedExpert.name}
                      {!selectedExpert.verified && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-normal">External</span>}
                    </h1>
                    <p className="text-blue-600 font-medium text-lg">{selectedExpert.title}</p>
                    
                    <div className="flex items-center text-slate-500 mt-2 mb-2">
                         <svg className="w-4 h-4 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                         {selectedExpert.location || "Location Unknown"}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-sm text-slate-500">
                      {selectedExpert.verified ? (
                         <span className="flex items-center"><svg className="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> {selectedExpert.rating} ({selectedExpert.reviewCount})</span>
                      ) : (
                         <span className="text-slate-400">Not rated yet</span>
                      )}
                      <span className="hidden sm:inline">•</span>
                      <span>{selectedExpert.experienceYears} Years Exp.</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{selectedExpert.category}</span>
                    </div>
                 </div>

                 <div>
                   <h3 className="text-xl font-bold text-slate-900 mb-3">About</h3>
                   <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{selectedExpert.bio}</p>
                 </div>

                 <div>
                   <h3 className="text-xl font-bold text-slate-900 mb-3">Languages</h3>
                   <div className="flex flex-wrap gap-2">
                     {selectedExpert.languages.map(l => (
                       <span key={l} className="bg-slate-100 px-3 py-1 rounded-full text-sm text-slate-700">{l}</span>
                     ))}
                   </div>
                 </div>

                 {/* Reviews Placeholder */}
                 {selectedExpert.verified && (
                  <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-4">Reviews</h3>
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xs">JD</div>
                          <span className="font-bold text-sm">John Doe</span>
                          <span className="text-xs text-slate-400">2 days ago</span>
                        </div>
                        <p className="text-slate-600 text-sm">"Excellent session! Very knowledgeable and helped me solve my problem in under 30 minutes."</p>
                      </div>
                  </div>
                 )}
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                 <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4">Availability</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-2">
                       {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                         <div key={day} className={`text-center py-2 rounded text-xs font-medium ${selectedExpert.availability.includes(day) || (selectedExpert.availability.includes('Weekends') && (day === 'Sat' || day === 'Sun')) ? 'bg-green-100 text-green-700' : 'bg-slate-50 text-slate-300'}`}>
                           {day}
                         </div>
                       ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-3 text-center">Timezone: UTC+01:00 (WAT)</p>
                 </div>

                 <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                    <h3 className="font-bold text-blue-900 mb-2">Why Tattaunawa360?</h3>
                    <ul className="text-sm text-blue-800 space-y-2 list-disc pl-4">
                       <li>Verified Identity</li>
                       <li>Secure Payments</li>
                       <li>Satisfaction Guarantee</li>
                       <li>High Quality Video Calls</li>
                    </ul>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
       <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">{t('dashboard')}</h2>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-lg mb-4 text-slate-700">Upcoming Sessions</h3>
             <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded p-2 text-center min-w-[3.5rem]">
                   <span className="block text-xs font-bold uppercase">Oct</span>
                   <span className="block text-xl font-bold">24</span>
                </div>
                <div>
                   <p className="font-bold text-slate-900">Dr. Amina Yusuf</p>
                   <p className="text-xs text-slate-500">14:00 - 15:00 • Video Call</p>
                   <button onClick={() => {setSelectedExpertId('1'); setShowVideoModal(true);}} className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Join Call</button>
                </div>
             </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-lg mb-4 text-slate-700">Recent Chats</h3>
             <div className="space-y-3">
               <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">SJ</div>
                  <div className="flex-1 min-w-0">
                     <p className="font-medium text-sm truncate">Sarah Jenkins</p>
                     <p className="text-xs text-slate-400 truncate">Thanks for the code review!</p>
                  </div>
               </div>
             </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-lg mb-4 text-slate-700">Stats</h3>
             <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-slate-50 p-3 rounded-lg">
                   <span className="block text-2xl font-bold text-blue-600">4</span>
                   <span className="text-xs text-slate-500">Sessions</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                   <span className="block text-2xl font-bold text-green-600">$450</span>
                   <span className="text-xs text-slate-500">Spent</span>
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  const renderHelpView = () => (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-slate-900">Help Center</h1>
      <div className="grid gap-6">
        {[
          { q: "How do I book a consultant?", a: "Simply browse our expert list, click on a profile, and use the 'Book' button to schedule a session." },
          { q: "Is the video call secure?", a: "Yes, all calls are encrypted end-to-end to ensure your privacy." },
          { q: "Can I get a refund?", a: "Refunds are available if the consultant misses the session or for technical failures. Contact support for assistance." },
          { q: "How do I become an expert?", a: "Click 'Join as Expert' on the homepage and fill out the verification form." }
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-2">{item.q}</h3>
            <p className="text-slate-600">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTermsView = () => (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6 text-slate-900">Terms of Service</h1>
      <div className="prose prose-slate">
        <p className="mb-4">Last updated: October 2023</p>
        <p className="mb-4">Welcome to {APP_NAME}. By accessing our website, you agree to be bound by these terms of service.</p>
        <h3 className="text-xl font-bold mt-6 mb-2">1. User Accounts</h3>
        <p className="mb-4">You are responsible for maintaining the security of your account and password.</p>
        <h3 className="text-xl font-bold mt-6 mb-2">2. Services</h3>
        <p className="mb-4">We provide a platform to connect users with independent consultants. We are not responsible for the advice given by consultants.</p>
        <h3 className="text-xl font-bold mt-6 mb-2">3. Payments</h3>
        <p className="mb-4">All payments are processed securely. Consultants set their own rates.</p>
      </div>
    </div>
  );

  const renderPrivacyView = () => (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6 text-slate-900">Privacy Policy</h1>
      <div className="prose prose-slate">
        <p className="mb-4">Your privacy is important to us. This policy explains how we handle your data.</p>
        <h3 className="text-xl font-bold mt-6 mb-2">Information We Collect</h3>
        <p className="mb-4">We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with other users.</p>
        <h3 className="text-xl font-bold mt-6 mb-2">How We Use Information</h3>
        <p className="mb-4">We use your information to provide, maintain, and improve our services, and to communicate with you.</p>
        <h3 className="text-xl font-bold mt-6 mb-2">Data Security</h3>
        <p className="mb-4">We implement appropriate technical and organizational measures to protect your personal data.</p>
      </div>
    </div>
  );

  const renderContactView = () => (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-slate-900">Contact Us</h1>
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Message sent!'); }}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="your@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
            <textarea className="w-full border border-slate-300 rounded-lg px-4 py-2 h-32 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="How can we help?"></textarea>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Send Message
          </button>
        </form>
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>Email: support@tattaunawa360.com</p>
          <p>Phone: +1 (555) 123-4567</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {renderNavbar()}
      
      <div className="flex-grow">
        {view === 'HOME' && (
          <>
            {renderHero()}
            <div className="py-12 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">{t('heroSubtitle')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {MOCK_CONSULTANTS.slice(0, 4).map(c => (
                    <ConsultantCard key={c.id} consultant={c} onViewProfile={handleViewExpert} compact />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        
        {view === 'BROWSE' && renderBrowseSection()}
        {view === 'REGION' && renderRegionSection()}
        {view === 'PROFILE' && renderProfileView()}
        {view === 'DASHBOARD' && renderDashboard()}
        {view === 'HELP' && renderHelpView()}
        {view === 'TERMS' && renderTermsView()}
        {view === 'PRIVACY' && renderPrivacyView()}
        {view === 'CONTACT' && renderContactView()}
      </div>

      <ChatWidget onViewExpert={handleViewExpert} />

      {showVideoModal && selectedExpertId && (
        <VideoModal 
          expertName={getExpertForProfile()?.name || 'Consultant'} 
          onClose={() => setShowVideoModal(false)} 
        />
      )}

      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl font-bold mb-4">{APP_NAME}</h3>
              <p className="text-slate-400 max-w-sm">{TAGLINE}</p>
              <div className="mt-6 flex space-x-4">
                {/* Social placeholders */}
                <div className="w-6 h-6 bg-slate-700 rounded-full cursor-pointer hover:bg-slate-600"></div>
                <div className="w-6 h-6 bg-slate-700 rounded-full cursor-pointer hover:bg-slate-600"></div>
                <div className="w-6 h-6 bg-slate-700 rounded-full cursor-pointer hover:bg-slate-600"></div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li onClick={() => handleNavClick('BROWSE')} className="cursor-pointer hover:text-white transition-colors">{t('findExpert')}</li>
                <li onClick={() => handleNavClick('HELP')} className="cursor-pointer hover:text-white transition-colors">How it Works</li>
                <li onClick={() => handleNavClick('HELP')} className="cursor-pointer hover:text-white transition-colors">Pricing</li>
                <li onClick={() => handleNavClick('TERMS')} className="cursor-pointer hover:text-white transition-colors">Trust & Safety</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li onClick={() => handleNavClick('HELP')} className="cursor-pointer hover:text-white transition-colors">Help Center</li>
                <li onClick={() => handleNavClick('TERMS')} className="cursor-pointer hover:text-white transition-colors">Terms of Service</li>
                <li onClick={() => handleNavClick('PRIVACY')} className="cursor-pointer hover:text-white transition-colors">Privacy Policy</li>
                <li onClick={() => handleNavClick('CONTACT')} className="cursor-pointer hover:text-white transition-colors">Contact Us</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} {FOOTER_COPY}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
