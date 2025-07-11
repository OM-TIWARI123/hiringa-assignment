import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function CampaignHistory({
  onCampaignSelect,
}: {
  onCampaignSelect: (id: string|null) => void;
}) {
  const campaigns = useQuery(api.campaigns.list) ?? [];

  return (
    <div className="w-full p-6">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-3xl font-bold mb-8">Campaign History</h1>

        <div className="flex flex-col gap-4">
          {campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-gray-500">
                No campaigns created yet. Create your first campaign from the Home tab!
              </p>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <button
                key={campaign._id}
                onClick={() => onCampaignSelect(campaign._id)}
                className="w-full bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-medium">
                      {campaign.name}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${campaign.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : campaign.status === "generated"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                    >
                      {campaign.status}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(campaign._creationTime).toLocaleDateString()}
                  </span>
                </div>
                {campaign.instructions && (
                  <p className="mt-2 text-gray-600 text-sm line-clamp-2">
                    {campaign.instructions}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
