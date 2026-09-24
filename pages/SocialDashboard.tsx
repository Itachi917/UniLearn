import React, { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import { useApp } from '../context/AppContext';
import { Swords, Users, MessageSquare, Trophy, Plus, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const SocialDashboard: React.FC = () => {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<'groups' | 'battles'>('groups');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Navbar />
        <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Users className="text-blue-500" />
                        Community Hub
                    </h1>
                    <p className="text-gray-500">Study together, battle for points, and climb the leaderboard.</p>
                </div>
                
                <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('groups')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'groups' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <MessageSquare size={16} /> Study Groups
                    </button>
                    <button 
                        onClick={() => setActiveTab('battles')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'battles' ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <Swords size={16} /> Battles
                    </button>
                </div>
            </div>

            {activeTab === 'groups' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        {/* Placeholder for groups list */}
                        <div className="bg-card dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 text-center py-12">
                            <Users size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Groups Joined</h3>
                            <p className="text-gray-500 mb-6">Join a study group to discuss lectures and share notes.</p>
                            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
                                Browse Groups
                            </button>
                        </div>
                    </div>
                    <div>
                        <div className="bg-card dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold mb-4">Create a Group</h3>
                            <input type="text" placeholder="Group Name" className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg mb-3 outline-none focus:ring-2 focus:ring-blue-500" />
                            <select className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500">
                                <option>Select Subject...</option>
                            </select>
                            <button className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
                                Create New Group
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'battles' && (
                <div className="text-center py-20 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border border-gray-700 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    
                    <div className="relative z-10 max-w-lg mx-auto px-6">
                        <div className="w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-orange-500/30">
                            <Swords size={48} className="text-orange-500" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-4">1v1 Study Battles</h2>
                        <p className="text-gray-400 mb-8 text-lg">Challenge your classmates to real-time quiz battles. Answer faster, earn more points, and dominate the leaderboard!</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <Trophy size={24} className="text-yellow-500 mx-auto mb-2" />
                                <div className="text-white font-bold">Earn XP</div>
                                <div className="text-xs text-gray-500">Winner takes all</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <Clock size={24} className="text-blue-500 mx-auto mb-2" />
                                <div className="text-white font-bold">Fast Paced</div>
                                <div className="text-xs text-gray-500">10s per question</div>
                            </div>
                        </div>

                        <button className="w-full sm:w-auto px-12 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-full font-black text-lg transition-transform hover:scale-105 shadow-[0_0_40px_rgba(249,115,22,0.4)]">
                            Find Match
                        </button>
                    </div>
                </div>
            )}
        </main>
    </div>
  );
};

export default SocialDashboard;
