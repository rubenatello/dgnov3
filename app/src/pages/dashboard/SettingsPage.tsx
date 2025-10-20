import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateUserProfile, getUserProfile } from '../../services/userService';
import { uploadMediaFile } from '../../services/mediaService';
import DashboardLayout from '../../components/DashboardLayout';
import type { User } from '../../types/models';
export default function SettingsPage() {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Profile form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');

  // Load user profile data
  useEffect(() => {
    async function loadProfile() {
      if (!currentUser?.uid) return;
      
      try {
        // First try to use userData from auth context if available
        let profile = userData;
        
        // If not available, fetch from database
        if (!profile) {
          profile = await getUserProfile(currentUser.uid);
        }
        
        if (profile) {
          setDisplayName(profile.displayName || '');
          setBio(profile.bio || '');
          setProfileImageUrl(profile.profileImageUrl || profile.avatarUrl || '');
          setWebsite(profile.website || '');
          setTwitter(profile.twitter || '');
          setLinkedin(profile.linkedin || '');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [currentUser?.uid, userData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const profileData: Partial<User> = {
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        profileImageUrl: profileImageUrl.trim() || undefined,
        website: website.trim() || undefined,
        twitter: twitter.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
      };

      await updateUserProfile(currentUser.uid, profileData);
      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError(null);
    try {
      const url = await uploadMediaFile(file, 'images');
      setProfileImageUrl(url);
    } catch (err) {
      console.error('Image upload failed', err);
      setError('Image upload failed. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center text-inkMuted">Loading profile...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-ink mb-6">Profile Settings</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Image */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Profile Image
          </label>
          <div className="flex items-center gap-4">
            {profileImageUrl ? (
              <img 
                src={profileImageUrl} 
                alt="Profile" 
                className="w-20 h-20 rounded-full object-cover border"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border">
                No Image
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="px-4 py-2 bg-accent text-white rounded cursor-pointer inline-flex items-center gap-2">
                {uploadingImage ? 'Uploading...' : 'Upload Image'}
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
              {profileImageUrl && (
                <button
                  type="button"
                  onClick={() => setProfileImageUrl('')}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Remove Image
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 border border-stone rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Your display name"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-stone rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Tell us about yourself..."
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Website
          </label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="w-full px-3 py-2 border border-stone rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="https://yourwebsite.com"
          />
        </div>

        {/* Social Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Twitter Username
            </label>
            <input
              type="text"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              className="w-full px-3 py-2 border border-stone rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="@yourusername"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              LinkedIn Profile
            </label>
            <input
              type="text"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              className="w-full px-3 py-2 border border-stone rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="linkedin.com/in/yourprofile"
            />
          </div>
        </div>

        {/* Account Info (Read-only) */}
        <div className="border-t border-stone pt-6">
          <h3 className="text-lg font-medium text-ink mb-4">Account Information</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Email:</span> {currentUser?.email}
            </div>
            <div>
              <span className="font-medium">Account Created:</span> {currentUser?.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'Unknown'}
            </div>
            <div>
              <span className="font-medium">Last Sign In:</span> {currentUser?.metadata?.lastSignInTime ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString() : 'Unknown'}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Image upload handled inline via file input (no media picker) */}
      </div>
    </DashboardLayout>
  );
}