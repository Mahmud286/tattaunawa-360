
import React from 'react';
import { Consultant } from '../types';

interface ConsultantCardProps {
  consultant: Consultant;
  onViewProfile: (id: string) => void;
  compact?: boolean;
}

const ConsultantCard: React.FC<ConsultantCardProps> = ({ consultant, onViewProfile, compact = false }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
      <div className={`relative h-32 bg-gradient-to-r ${consultant.verified ? 'from-blue-600 to-indigo-700' : 'from-slate-500 to-slate-700'}`}>
        <div className="absolute -bottom-10 left-4">
          <img 
            src={consultant.avatarUrl} 
            alt={consultant.name} 
            className="w-20 h-20 rounded-full border-4 border-white object-cover"
          />
        </div>
        {consultant.verified ? (
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Verified Expert
          </div>
        ) : (
          <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm text-slate-100 text-xs px-2 py-1 rounded-full flex items-center">
             External Profile
          </div>
        )}
      </div>
      
      <div className="pt-12 px-4 pb-4 flex-grow flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-slate-900">{consultant.name}</h3>
            <p className="text-blue-600 text-sm font-medium">{consultant.title}</p>
          </div>
          {consultant.verified && (
            <div className="flex items-center bg-yellow-50 px-2 py-1 rounded">
              <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-bold text-slate-700 text-sm">{consultant.rating}</span>
              <span className="text-slate-400 text-xs ml-1">({consultant.reviewCount})</span>
            </div>
          )}
        </div>

        {!compact && (
          <div className="mt-3">
             <div className="flex items-center text-xs text-slate-500 mb-2">
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {consultant.location || 'Location Unknown'}
             </div>

            <span className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md mb-2">
              {consultant.category}
            </span>
            <p className="text-slate-600 text-sm line-clamp-2">{consultant.bio}</p>
            
            <div className="mt-3 flex flex-wrap gap-1">
              {consultant.languages.map((lang, idx) => (
                <span key={idx} className="text-xs text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded">
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
          <div>
            {consultant.verified ? (
                <>
                  <span className="text-slate-900 font-bold text-lg">${consultant.hourlyRate}</span>
                  <span className="text-slate-500 text-sm">/hr</span>
                </>
            ) : (
                <span className="text-slate-400 text-sm italic">Rate unknown</span>
            )}
          </div>
          <button 
            onClick={() => onViewProfile(consultant.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${consultant.verified ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
          >
            {consultant.verified ? 'View Profile' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsultantCard;
