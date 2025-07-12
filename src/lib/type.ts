// Define the interface for conversation history items
export interface HistoryItem {
    // Role can be either "user" or "model"
    role: "user" | "model";
    // Parts can contain text and/or images
    parts: HistoryPart[];
  }
  
  // Define the interface for history parts
  export interface HistoryPart {
    // Text content (optional)
    text?: string;
    // Image content as data URL (optional)
    // Format: data:image/png;base64,... or data:image/jpeg;base64,...
    image?: string;
  }