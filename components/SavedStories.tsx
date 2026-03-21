
import React from 'react';
import type { SavedStory } from '../types';

interface SavedStoriesProps {
    savedStories: SavedStory[];
    onLoadStory: (story: SavedStory) => void;
    onDeleteStory: (storyId: string) => void;
}

const SavedStories: React.FC<SavedStoriesProps> = ({ savedStories, onLoadStory, onDeleteStory }) => {
    
    const handleDelete = (e: React.MouseEvent, storyId: string, storyTheme: string) => {
        e.stopPropagation();
        if (window.confirm(`Bạn có chắc chắn muốn xoá truyện "${storyTheme}" không?`)) {
            onDeleteStory(storyId);
        }
    };

    if (savedStories.length === 0) return null;

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-fade-in">
             <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4 ml-1">
                Thư viện của bạn
            </h2>
            <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {savedStories.map((story) => (
                    <li 
                        key={story.id} 
                        onClick={() => onLoadStory(story)}
                        className="group flex items-center justify-between p-3.5 bg-slate-50/50 rounded-2xl transition-all duration-300 hover:bg-white hover:shadow-lg hover:shadow-slate-200/30 cursor-pointer border border-transparent hover:border-slate-100"
                        tabIndex={0}
                    >
                        <div className="flex-grow overflow-hidden mr-3">
                            <p className="font-bold text-sm text-slate-700 truncate group-hover:text-indigo-600">
                                {story.formState.theme}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                {new Date(story.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                        </div>
                        <button 
                            onClick={(e) => handleDelete(e, story.id, story.formState.theme)} 
                            className="p-2 rounded-xl bg-rose-50 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-100"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SavedStories;
