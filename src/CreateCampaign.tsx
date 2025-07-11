import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";
import { Dropzone } from "./components/Dropzone";


type Section = "basics" | "product" | "layout" | "review";

export function CreateCampaign({
  onCampaignCreated,
}: {
  onCampaignCreated: (id: string) => void;
}) {
  const companies = useQuery(api.companies.list) ?? [];
  const createCampaign = useMutation(api.campaigns.create);
  const createProduct=useMutation(api.productImage.saveProductImage)
  const generateUploadUrl = useMutation(api.companies.generateUploadUrl);
  const [currentSection, setCurrentSection] = useState<Section>("basics");

  // Form state
  const [name, setName] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [instructions, setInstructions] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [layoutImage, setLayoutImage] = useState<File | null>(null);
  
  const sections: Section[] = ["basics", "product", "layout", "review"];
  const currentIndex = sections.indexOf(currentSection);
  const progress = ((currentIndex + 1) / sections.length) * 100;
  
  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < sections.length) {
      setCurrentSection(sections[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentSection(sections[prevIndex]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If not in review section, just move to next section
    if (currentSection !== "review") {
      handleNext();
      return;
    }

    // Only proceed with submission if we're in review section
    if (!name.trim()) {
      toast.error("Campaign name is required");
      return;
    }
    if (!selectedCompanyId) {
      toast.error("Please select a company");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload product image if provided
      let productImageId: Id<"_storage"> | undefined;
      if (productImage) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": productImage.type },
          body: productImage,
        });
        if (!result.ok) {
          throw new Error("Failed to upload product image");
        }
        const { storageId } = await result.json();
        productImageId = storageId;
      }

      // Upload layout image if provided
      let layoutImageId: Id<"_storage"> | undefined;
      if (layoutImage) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": layoutImage.type },
          body: layoutImage,
        });
        if (!result.ok) {
          throw new Error("Failed to upload layout image");
        }
        const { storageId } = await result.json();
        layoutImageId = storageId;
      }

      const campaignId = await createCampaign({
        name: name.trim(),
        companyId: selectedCompanyId as Id<"companies">,
        instructions: instructions || undefined,
        productDescription: productDescription || undefined,
        layoutImageId,
      });
      await createProduct({
        campaignId,
        productImageId,
        isPrimary:true,

      })

      toast.success("Campaign created successfully!");
      onCampaignCreated(campaignId);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (companies.length === 0) {
    return (
      <div className="w-full p-6">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-8">Create New Marketing Campaign</h1>
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700">
                  Please create a company first in the Company Assets tab before creating a campaign.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderBasicsSection = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Campaign Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Enter campaign name"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Select Company <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">Select a company</option>
          {companies.map((company) => (
            <option key={company._id} value={company._id}>
              {company.name || `Company ${company._id.slice(-6)}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderProductSection = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Product Image
        </label>
        <Dropzone
          onDrop={(files) => setProductImage(files[0])}
          accept={{
            'image/*': ['.jpeg', '.jpg', '.png']
          }}
          multiple={false}
        />
        {productImage && (
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-sm text-gray-500">{productImage.name}</span>
            <button
              type="button"
              onClick={() => setProductImage(null)}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Product Description
        </label>
        <textarea
          value={productDescription}
          onChange={(e) => setProductDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Enter product description..."
        />
      </div>
    </div>
  );

  const renderLayoutSection = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Layout Image
        </label>
        <Dropzone
          onDrop={(files) => setLayoutImage(files[0])}
          accept={{
            'image/*': ['.jpeg', '.jpg', '.png']
          }}
          multiple={false}
        />
        {layoutImage && (
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-sm text-gray-500">{layoutImage.name}</span>
            <button
              type="button"
              onClick={() => setLayoutImage(null)}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Specific instructions for post
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Enter specific instructions..."
        />
      </div>
    </div>
  );

  const renderReviewSection = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-medium mb-4">Campaign Summary</h3>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-gray-500">Campaign Name</dt>
            <dd className="mt-1">{name}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Selected Company</dt>
            <dd className="mt-1">
              {companies.find(c => c._id === selectedCompanyId)?.name || 'None selected'}
            </dd>
          </div>
          {productDescription && (
            <div>
              <dt className="text-sm text-gray-500">Product Description</dt>
              <dd className="mt-1">{productDescription}</dd>
            </div>
          )}
          {instructions && (
            <div>
              <dt className="text-sm text-gray-500">Post Instructions</dt>
              <dd className="mt-1">{instructions}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm text-gray-500">Uploaded Files</dt>
            <dd className="mt-1">
              <ul className="list-disc list-inside">
                {productImage && <li>Product Image: {productImage.name}</li>}
                {layoutImage && <li>Layout Image: {layoutImage.name}</li>}
              </ul>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (currentSection) {
      case "basics":
        return renderBasicsSection();
      case "product":
        return renderProductSection();
      case "layout":
        return renderLayoutSection();
      case "review":
        return renderReviewSection();
    }
  };

  const canProceed = () => {
    switch (currentSection) {
      case "basics":
        return name.trim() && selectedCompanyId;
      case "product":
      case "layout":
      case "review":
        return true;
    }
  };

  return (
    <div className="w-full p-6">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Create New Marketing Campaign</h1>
          <div className="text-sm text-gray-500">
            Step {currentIndex + 1} of {sections.length}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {renderCurrentSection()}

          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleBack}
              className={`px-6 py-2 text-indigo-600 font-medium rounded-lg
                hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                ${currentIndex === 0 ? 'invisible' : ''}`}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canProceed()}
              className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg
                hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200"
            >
              {currentSection === "review"
                ? (isSubmitting ? "Creating..." : "Create Campaign")
                : "Next"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
