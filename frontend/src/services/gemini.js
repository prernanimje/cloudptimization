import { GoogleGenerativeAI } from '@google/generative-ai';
import { analysisAPI } from '../api';

// Clean and extract API key from environment variables
const getApiKey = () => {
    const rawKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    return rawKey.replace(/^["']|["']$/g, '').trim();
};

export const isGeminiConfigured = () => {
    const key = getApiKey();
    return Boolean(key && key !== 'your-gemini-api-key-here');
};

// Fallback cascade using currently supported Gemini models
const fallbackModels = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-flash-latest",
    "gemini-pro-latest"
];
/**
 * Generate a response using Google Gemini
 * 
 * @param {string} prompt - The user's input/question
 * @param {object} contextData - Context about the server to inject into the prompt
 * @returns {Promise<string>} The AI response text
 */
export const generateGeminiResponse = async (prompt, contextData, fileData = null) => {
    // 1. Try secure backend endpoint first (keeps API key hidden in backend)
    try {
        const res = await analysisAPI.chat({
            prompt,
            context: contextData,
            file_data: fileData
        });
        if (res && res.response) {
            return res.response;
        }
    } catch (backendErr) {
        console.warn("Backend Gemini chat endpoint unavailable, checking client fallback:", backendErr);
    }

    // 2. Client-side fallback if VITE_GEMINI_API_KEY is present
    const key = getApiKey();
    if (!key || key === 'your-gemini-api-key-here') {
        return "Error: Gemini API Key is missing. Please add GEMINI_API_KEY to your backend environment variables.";
    }

    let genAI;
    try {
        genAI = new GoogleGenerativeAI(key);
    } catch (err) {
        console.error("Failed to initialize GoogleGenerativeAI client:", err);
        return "Error: Invalid Gemini API Key format.";
    }

    // Construct a master prompt giving Gemini context about the application and the selected instance
    let systemContext = `
    You are a helpful Real-Time Cloud Optimization AI Assistant and Predictor.
    You are integrated into a Cloud Cost Dashboard that simulates real-time metrics.
    
    Current Server Status Context:
    - Server Name: ${contextData?.name || 'Unknown'}
    - Environment Region: ${contextData?.region || 'Unknown'}
    - Current CPU Usage: ${contextData?.cpu_usage?.toFixed(1) || 0}%
    - Current RAM Usage: ${contextData?.ram_usage?.toFixed(1) || 0}%
    - Current Storage Usage: ${contextData?.storage_usage?.toFixed(1) || 0}%
    - Monthly Cost Tracking: $${contextData?.monthly_cost?.toFixed(2) || '0.00'}
    - Overall Health Status: ${contextData?.status || 'Unknown'}

    Your Capabilities:
    1. Respond with ALL the possibilities and strategies for cloud cost optimization. This includes but is not limited to:
       - **Rightsizing**: Analyzing CPU/RAM trends to downsize overprovisioned instances.
       - **Instance Scheduling**: Automatically stopping instances during non-business hours (10 PM - 6 AM).
       - **Spot Instances**: Migrating fault-tolerant workloads to much cheaper spot capacity.
       - **Reserved Instances (RIs) / Savings Plans**: Committing to 1-3 year terms for 72% cost reduction.
       - **Storage Optimization**: Identifying unattached EBS volumes, old snapshots, and moving rarely accessed data to S3 Glacier/Archival tiers.
       - **Region/Zone Shifting**: Moving workloads to cheaper regions (e.g., ap-south-1 vs us-east-1).
       - **Auto-scaling**: Implementing horizontal pod autoscaling to match demand exactly.
       - **Idle Resource Termination**: Detecting and killing "zombie" instances with <1% usage.
    2. Analyze raw data or CSV files if attached and extract actionable predicted insights.
    3. Make real-time predictions based on current metrics (e.g., "At this rate, your storage will hit 100% in 12 days").
    4. Provide a full cost-benefit analysis for any suggestion.

    Your goal is to answer the user's questions regarding their cloud infrastructure, provide optimization advice based on this context, and act as a highly knowledgeable DevOps/FinOps predictive assistant. Use professional but encouraging tone. Format everything beautifully using markdown (tables, bold text, bullet points).
  `;

    let fullPrompt = `${systemContext}\n\nUser Message: ${prompt}`;

    if (fileData) {
        fullPrompt += `\n\nATTACHED FILE DATA (RAW/CSV):\n${fileData}\n\nPlease analyze this data carefully and include predictions/insights.`;
    }

    let lastError = null;

    // Iterate through our fallback models
    for (const modelName of fallbackModels) {
        try {
            const currentModel = genAI.getGenerativeModel({ model: modelName });
            const result = await currentModel.generateContent(fullPrompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.warn(`Gemini API Error with model ${modelName}:`, error.message);
            lastError = error;
            // Continue trying other fallback models
            continue;
        }
    }

    // If we exhaust all models or break early, return the graceful user-facing error containing our final catch
    console.error("All Gemini API fallbacks exhausted or failed:", lastError);
    return "I encountered an error trying to connect to Google Gemini. Please check your API key and connection, or retry in a few moments.";
};
