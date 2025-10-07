"use client"

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './ui/button';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: {
    id: number;
    email: string;
    username?: string;
    role: string;
  } | null;
  isDeleting: boolean;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  isDeleting
}) => {
  const [confirmationText, setConfirmationText] = React.useState('');
  const [isValid, setIsValid] = React.useState(false);

  // Generate confirmation text based on user info
  const expectedText = user ? `${user.email}` : '';
  const isConfirmationValid = confirmationText === expectedText;

  React.useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
      setIsValid(false);
    }
  }, [isOpen]);

  React.useEffect(() => {
    setIsValid(isConfirmationValid);
  }, [confirmationText, isConfirmationValid]);

  const handleConfirm = () => {
    if (isValid && !isDeleting) {
      onConfirm();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid && !isDeleting) {
      handleConfirm();
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Delete User
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This action cannot be undone
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="ml-auto text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Message */}
        <div className="mb-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Are you absolutely sure?
                </h4>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>This will permanently delete the user account and all associated data:</p>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>User profile and settings</li>
                    <li>Login history and sessions</li>
                    <li>Access permissions and roles</li>
                    <li>All user activity logs</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            User to be deleted:
          </h4>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Username:</strong> {user.username || 'Not set'}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>User ID:</strong> {user.id}</p>
          </div>
        </div>

        {/* Confirmation Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            To confirm deletion, type the user's email address:
          </label>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-red-600 dark:text-red-400">
              {user.email}
            </code>
          </div>
          <input
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Type "${user.email}" to confirm`}
            disabled={isDeleting}
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              confirmationText && !isConfirmationValid
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : isConfirmationValid
                ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
            } dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100`}
            autoFocus
          />
          {confirmationText && !isConfirmationValid && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              Email address does not match
            </p>
          )}
          {isConfirmationValid && (
            <p className="mt-1 text-sm text-green-600 dark:text-green-400">
              ✓ Email address matches
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button
            onClick={onClose}
            disabled={isDeleting}
            variant="outline"
            className="px-4 py-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || isDeleting}
            className={`px-4 py-2 ${
              isValid && !isDeleting
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isDeleting ? (
              <>
                <div className="loader w-4 h-4 mr-2"></div>
                Deleting...
              </>
            ) : (
              'Delete User'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
