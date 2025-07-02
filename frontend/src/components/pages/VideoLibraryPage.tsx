import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { tokenStorage } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import VideoPlayer from '../tutor/VideoPlayer';
import { 
  VideoCameraIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  TrashIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface VideoItem {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  subject: string;
  difficulty: string;
  duration: number;
  size: number;
  createdAt: Date;
  question: {
    content: string;
    type: 'text' | 'voice' | 'image';
  };
  answer: {
    content: string;
    rating?: number;
  };
}

const VideoLibraryPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  
  // State
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'subject' | 'duration'>('newest');
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter options
  const subjects = ['all', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Literature', 'Economics'];
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];

  // Load videos on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadVideos();
    }
  }, [isAuthenticated]);

  // Filter and sort videos
  useEffect(() => {
    let filtered = videos.filter(video => {
      const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           video.question.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           video.answer.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = selectedSubject === 'all' || video.subject === selectedSubject;
      const matchesDifficulty = selectedDifficulty === 'all' || video.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesSubject && matchesDifficulty;
    });

    // Sort videos
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'subject':
          return a.subject.localeCompare(b.subject);
        case 'duration':
          return b.duration - a.duration;
        default:
          return 0;
      }
    });

    setFilteredVideos(filtered);
  }, [videos, searchQuery, selectedSubject, selectedDifficulty, sortBy]);

  const loadVideos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tutor/videos', {
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setVideos(data.data.videos || []);
      } else {
        showToast(data.message || 'Failed to load videos', 'error');
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      showToast('Failed to load video library', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadVideo = async (video: VideoItem) => {
    try {
      const response = await fetch(video.videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${video.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Video download started', 'success');
    } catch (error) {
      showToast('Failed to download video', 'error');
    }
  };

  const shareVideo = async (video: VideoItem) => {
    try {
      const shareData = {
        title: video.title,
        text: `Check out this AI-generated explanation: ${video.answer.content.substring(0, 100)}...`,
        url: video.videoUrl
      };
      
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`);
        showToast('Video link copied to clipboard', 'success');
      }
    } catch (error) {
      showToast('Failed to share video', 'error');
    }
  };

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/tutor/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setVideos(prev => prev.filter(v => v.id !== videoId));
        setCurrentVideo(null);
        showToast('Video deleted successfully', 'success');
      } else {
        showToast(data.message || 'Failed to delete video', 'error');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      showToast('Failed to delete video', 'error');
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Please log in to access your video library.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
        <span className="ml-2">Loading your videos...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <VideoCameraIcon className="h-8 w-8 mr-3 text-blue-600" />
                  Video Library
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  All your AI-generated video explanations in one place
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  {videos.length} video{videos.length !== 1 ? 's' : ''}
                </span>
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  size="sm"
                >
                  <FunnelIcon className="h-4 w-4 mr-1" />
                  Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters & Search Sidebar */}
          <div className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Videos
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, question, or answer..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Subject Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>
                      {subject === 'all' ? 'All Subjects' : subject}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty === 'all' ? 'All Levels' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="subject">Subject</option>
                  <option value="duration">Duration</option>
                </select>
              </div>
            </div>
          </div>

          {/* Video Grid */}
          <div className="flex-1">
            {filteredVideos.length === 0 ? (
              <div className="text-center py-12">
                <VideoCameraIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {videos.length === 0 ? 'No videos yet' : 'No videos found'}
                </h3>
                <p className="text-gray-600">
                  {videos.length === 0 
                    ? 'Start asking questions and generate video explanations to build your library.'
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVideos.map((video) => (
                  <div
                    key={video.id}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setCurrentVideo(video)}
                  >
                    {/* Video Thumbnail */}
                    <div className="aspect-video bg-gray-100 rounded-t-lg relative overflow-hidden">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <VideoCameraIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Duration Badge */}
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {formatDuration(video.duration)}
                      </div>
                    </div>

                    {/* Video Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {video.title}
                      </h3>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <AcademicCapIcon className="h-4 w-4 mr-1" />
                          {video.subject}
                        </div>
                        <div className="flex items-center">
                          <CalendarDaysIcon className="h-4 w-4 mr-1" />
                          {new Date(video.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {video.question.content}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              downloadVideo(video);
                            }}
                            className="p-1 text-gray-600 hover:text-blue-600"
                            title="Download"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              shareVideo(video);
                            }}
                            className="p-1 text-gray-600 hover:text-blue-600"
                            title="Share"
                          >
                            <ShareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              deleteVideo(video.id);
                            }}
                            className="p-1 text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {formatFileSize(video.size)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {currentVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentVideo.title}
                </h2>
                <Button
                  onClick={() => setCurrentVideo(null)}
                  variant="outline"
                  size="sm"
                >
                  Close
                </Button>
              </div>

              {/* Video Player */}
              <div className="mb-6">
                <VideoPlayer
                  videoUrl={currentVideo.videoUrl}
                  title={currentVideo.title}
                  onDownload={() => downloadVideo(currentVideo)}
                />
              </div>

              {/* Video Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Subject:</span>
                    <p className="font-medium">{currentVideo.subject}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Difficulty:</span>
                    <p className="font-medium capitalize">{currentVideo.difficulty}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <p className="font-medium">{formatDuration(currentVideo.duration)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <p className="font-medium">{new Date(currentVideo.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Original Question:</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {currentVideo.question.content}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Answer Summary:</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {currentVideo.answer.content.substring(0, 500)}
                    {currentVideo.answer.content.length > 500 && '...'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 pt-4 border-t">
                  <Button
                    onClick={() => downloadVideo(currentVideo)}
                    variant="primary"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={() => shareVideo(currentVideo)}
                    variant="outline"
                  >
                    <ShareIcon className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    onClick={() => deleteVideo(currentVideo.id)}
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoLibraryPage;
