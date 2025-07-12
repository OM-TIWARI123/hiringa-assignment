import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Dropzone } from "./components/Dropzone";
import { Id } from "../convex/_generated/dataModel";
import { Outlet } from "react-router-dom";

type Section = "basics" | "media" | "review";

export function CompanyAssets() {
  const companies = useQuery(api.companies.list) ?? [];
  const createCompany = useMutation(api.companies.create);
  const generateUploadUrl = useMutation(api.companies.generateUploadUrl);
  const [currentSection, setCurrentSection] = useState<Section>("basics");

  // Form state
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [assets, setAssets] = useState<File[]>([]);

  const sections: Section[] = ["basics", "media", "review"];
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

    if (!name.trim()) {
      toast.error("Company name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      // Upload logo if provided
      let logoFileId: Id<"_storage"> | undefined;
      if (logo) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": logo.type },
          body: logo,
        });
        if (!result.ok) {
          throw new Error("Failed to upload logo");
        }
        const { storageId } = await result.json();
        logoFileId = storageId;
      }

      // Upload assets if provided
      const assetsFileIds: Id<"_storage">[] = [];
      for (const file of assets) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!result.ok) {
          throw new Error("Failed to upload asset");
        }
        const { storageId } = await result.json();
        assetsFileIds.push(storageId);
      }

      await createCompany({
        name: name.trim(),
        websiteUrl: websiteUrl || undefined,
        description: description || undefined,
        logoFileId,
        assetsFileIds: assetsFileIds.length > 0 ? assetsFileIds : undefined,
      });

      setName("");
      setWebsiteUrl("");
      setDescription("");
      setLogo(null);
      setAssets([]);
      setCurrentSection("basics");
      toast.success("Company assets saved successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save company assets");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBasicsSection = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Company Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Enter company name"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Website URL
        </label>
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="https://example.com"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Company Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Describe your company..."
        />
      </div>
    </div>
  );

  const renderMediaSection = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Company Logo
        </label>
        <Dropzone
          onDrop={(files) => setLogo(files[0])}
          accept={{
            'image/*': ['.jpeg', '.jpg', '.png', '.svg']
          }}
          multiple={false}
        />
        {logo && (
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-sm text-gray-500">{logo.name}</span>
            <button
              type="button"
              onClick={() => setLogo(null)}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Additional Assets
        </label>
        <Dropzone
          onDrop={(files) => setAssets(prev => [...prev, ...files])}
          accept={{
            'image/*': ['.jpeg', '.jpg', '.png', '.svg']
          }}
          multiple={true}
        />
        {assets.length > 0 && (
          <div className="mt-2 space-y-2">
            {assets.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm text-gray-500">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setAssets(prev => prev.filter((_, i) => i !== index))}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderReviewSection = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-medium mb-4">Company Summary</h3>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-gray-500">Company Name</dt>
            <dd className="mt-1">{name}</dd>
          </div>
          {websiteUrl && (
            <div>
              <dt className="text-sm text-gray-500">Website URL</dt>
              <dd className="mt-1">{websiteUrl}</dd>
            </div>
          )}
          {description && (
            <div>
              <dt className="text-sm text-gray-500">Description</dt>
              <dd className="mt-1">{description}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm text-gray-500">Uploaded Files</dt>
            <dd className="mt-1">
              <ul className="list-disc list-inside">
                {logo && <li>Logo: {logo.name}</li>}
                {assets.map((file, index) => (
                  <li key={index}>Asset: {file.name}</li>
                ))}
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
      case "media":
        return renderMediaSection();
      case "review":
        return renderReviewSection();
    }
  };

  const canProceed = () => {
    switch (currentSection) {
      case "basics":
        return name.trim();
      case "media":
      case "review":
        return true;
    }
  };

  return (
    <div className="w-full flex flex-col gap-8 p-6">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Company Assets</h1>
          <div className="text-sm text-gray-500">
            Step {currentIndex + 1} of {sections.length}
          </div>
        </div>

        <form onSubmit={()=>handleSubmit} className="space-y-8">
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
                ? (isSubmitting ? "Creating..." : "Create Company")
                : "Next"}
            </button>
          </div>
        </form>
      </div>

      {companies.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-3xl font-bold mb-8">Saved Companies</h2>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {companies.map((company) => (
              <div
                key={company._id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-medium mb-2">{company.name}</h3>
                {company.websiteUrl && (
                  <a
                    href={company.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-700 block mb-2"
                  >
                    {company.websiteUrl}
                  </a>
                )}
                {company.description && (
                  <p className="text-sm text-gray-600">
                    {company.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <Outlet/>
    </div>
  );
}
