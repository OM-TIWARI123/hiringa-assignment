import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";

export function ReviewPosts({
  campaignId,
  onBack,
}: {
  campaignId: string;
  onBack: () => void;
}) {
  const campaign = useQuery(api.campaigns.get, { campaignId: campaignId as Id<"campaigns"> });
  const updateSelectedPosts = useMutation(api.campaigns.updateSelectedPosts);
  const updateEditPrompt = useMutation(api.campaigns.updateEditPrompt);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [editPrompts, setEditPrompts] = useState<Record<number, string>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  if (!campaign || !campaign.posts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const posts = campaign.posts.posts;
  const totalPages = Math.ceil(posts.length / 4);

  const handleCheckPost = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const handleEditPromptSubmit = async (index: number) => {
    const prompt = editPrompts[index] || "";
    await updateEditPrompt({
      campaignId: campaignId as Id<"campaigns">,
      postIndex: index,
      editPrompt: prompt,
    });
    toast.success("Edit prompt saved");
  };

  const handleExport = async () => {
    await updateSelectedPosts({
      campaignId: campaignId as Id<"campaigns">,
      selectedPosts: selectedIndices,
    });

    const selectedPosts = selectedIndices
      .map((index) => posts[index].text)
      .join("\n\n");
    await navigator.clipboard.writeText(selectedPosts);
    toast.success("Selected posts copied to clipboard!");
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setIsTransitioning(true);
      setCurrentPage(prev => prev - 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setIsTransitioning(true);
      setCurrentPage(prev => prev + 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const renderPost = (index: number) => {
    if (index >= posts.length) return null;
    const post = posts[index];
    const isSelected = selectedIndices.includes(index);

    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 hover:shadow-md transition-shadow h-full flex flex-col relative">
        {/* Selected corner triangle */}
        {isSelected && (
          <div className="absolute top-0 right-0 w-0 h-0 border-t-[2rem] sm:border-t-[3rem] border-r-[2rem] sm:border-r-[3rem] border-green-500 border-l-transparent border-b-transparent">
            <svg
              className="absolute top-[-1.5rem] sm:top-[-2.5rem] right-[-1.5rem] sm:right-[-2.5rem] w-4 h-4 sm:w-5 sm:h-5 text-white transform rotate-45"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Finalize button */}
        <button
          onClick={() => handleCheckPost(index)}
          className={`absolute top-2 right-2 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors
            ${isSelected
              ? 'text-green-700 bg-green-100 hover:bg-green-200'
              : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
        >
          {isSelected ? 'Selected' : 'Finalize'}
        </button>

        <div className="prose max-w-none mb-4 flex-grow mt-6 sm:mt-8">
          <p className="text-gray-800 text-sm sm:text-base">{post.text}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Edit Prompt (e.g., 'Make it shorter', 'Add emojis')"
            value={editPrompts[index] || post.editPrompt || ""}
            onChange={(e) => setEditPrompts(prev => ({ ...prev, [index]: e.target.value }))}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
          <button
            onClick={() => handleEditPromptSubmit(index)}
            disabled={!editPrompts[index] && !post.editPrompt}
            className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium
              hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200 text-sm"
          >
            Save
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto"> {/* Reduced from max-w-6xl */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <button
            onClick={onBack}
            className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-center sm:text-left">Review & Edit Posts</h1>
          <div className="text-sm text-gray-500">
            Page {currentPage + 1} of {totalPages}
          </div>
        </div>

        <div className="relative px-4 sm:px-12"> {/* Added horizontal padding for chevron space */}
          {/* Previous button */}
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10
              w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg flex items-center justify-center
              text-gray-600 hover:text-indigo-600 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next button */}
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10
              w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg flex items-center justify-center
              text-gray-600 hover:text-indigo-600 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Carousel content */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-4 mb-6 sm:mb-8 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'
              }`}
          >
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {renderPost(currentPage * 4)}
              {renderPost(currentPage * 4 + 2)}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {renderPost(currentPage * 4 + 1)}
              {renderPost(currentPage * 4 + 3)}
            </div>
          </div>
        </div>

        <div className="sticky bottom-4 sm:bottom-8 flex justify-center px-4">
          <button
            onClick={handleExport}
            disabled={selectedIndices.length === 0}
            className="px-4 sm:px-8 py-3 sm:py-4 bg-indigo-600 text-white rounded-lg font-medium shadow-lg
              hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200 text-sm sm:text-base w-full sm:w-auto"
          >
            Finalize & Export {selectedIndices.length} Selected Posts
          </button>
        </div>
      </div>
    </div>
  );
}
