
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import type { StoryFormState, StoryGenerationResponse, ScriptFormState, ScenePrompt, ArticleData, AdImageFormState, AdSuggestion, AdImageFile, AdImageRole, AffiliateFormState, AffiliateScriptResult } from '../types';

const GEMINI_MODEL = "gemini-3-flash-preview"; 
const GEMINI_PRO_MODEL = "gemini-3-pro-preview";
const IMAGE_GEN_MODEL = "imagen-4.0-generate-001";

/** 
 * Ưu tiên sử dụng 'gemini-2.5-flash-image' (Nano Banana) 
 * Đây là model chuyên dụng cho sáng tạo và chỉnh sửa ảnh với tốc độ cực nhanh
 * và yêu cầu quyền hạn linh hoạt hơn.
 */
const IMAGE_EDIT_MODEL = "gemini-2.5-flash-image"; 
const VEO_MODEL = "veo-3.1-fast-generate-preview";

// Hàm khởi tạo instance mới để đảm bảo lấy API Key mới nhất từ window.aistudio hoặc custom key
const getAI = (customApiKey?: string) => {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("MISSING_API_KEY");
  return new GoogleGenAI({ apiKey });
};

// Robust content generation with retry logic
async function generateContentWithRetry(
    params: { model: string; contents: any; config?: any; },
    customApiKey?: string,
    maxRetries = 2,
    initialDelay = 1000
): Promise<GenerateContentResponse> {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const ai = getAI(customApiKey);
            const response = await ai.models.generateContent(params);
            return response;
        } catch (error: any) {
            console.error("API Error Debug:", error);
            const errorMsg = error?.message || "";
            const statusCode = error?.status || "";
            
            if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
                throw new Error("QUOTA_EXCEEDED");
            }
            // Lỗi 403: Quyền truy cập bị từ chối
            if (errorMsg.includes("403") || errorMsg.includes("PERMISSION_DENIED") || statusCode === "PERMISSION_DENIED") {
                throw new Error("PERMISSION_DENIED");
            }
            if (errorMsg.includes("404")) {
                throw new Error("MODEL_NOT_FOUND");
            }

            attempt++;
            if (attempt >= maxRetries) throw error;
            await new Promise(resolve => setTimeout(resolve, initialDelay * attempt));
        }
    }
    throw new Error("Failed after retries");
}

// Centralized error handling for Gemini API
function handleGeminiError(error: unknown, context: string): Error {
    const msg = error instanceof Error ? error.message : String(error);
    
    if (msg === "MISSING_API_KEY") {
        return new Error("Chưa tìm thấy API Key. Vui lòng nhấn vào biểu tượng bánh răng ở góc màn hình để cấu hình API Key. Bạn có thể lấy key miễn phí tại: https://aistudio.google.com/app/apikey");
    }
    if (msg === "QUOTA_EXCEEDED") {
        return new Error("Hạn mức sử dụng miễn phí đã hết. Vui lòng nhấn vào biểu tượng bánh răng ở góc màn hình và nhập API Key cá nhân của bạn để tiếp tục sử dụng.");
    }
    if (msg === "PERMISSION_DENIED") {
        return new Error("Lỗi 403: API Key này không có quyền sử dụng model AI sáng tạo ảnh (Nano Banana). Hãy đảm bảo bạn dùng API Key từ Google AI Studio (ai.google.dev) và Project đã bật Billing.");
    }
    
    return new Error(`Lỗi ${context}: ${msg}`);
}

const parseJsonResponse = <T>(responseText: string, context: string): T => {
    try {
        const cleanJson = responseText.trim().replace(/^```json/, '').replace(/```$/, '');
        return JSON.parse(cleanJson) as T;
    } catch (e) {
        throw new Error(`AI response for ${context} không đúng định dạng JSON`);
    }
};

// Image background removal using Nano Banana
export async function removeBackground(file: AdImageFile, customApiKey?: string): Promise<string> {
    const parts = [
      { inlineData: { data: file.base64, mimeType: file.mimeType } },
      { text: "Task: Remove background. Keep only the main subject. Output as a base64 image part." }
    ];
    try {
        const res = await generateContentWithRetry({
            model: IMAGE_EDIT_MODEL,
            contents: { parts }
        }, customApiKey);
        const imagePart = res.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (!imagePart?.inlineData?.data) throw new Error("Nano Banana không trả về dữ liệu ảnh.");
        return imagePart.inlineData.data;
    } catch (error) {
        throw handleGeminiError(error, "tách nền ảnh");
    }
}

// High-end image retouching with identity preservation
export async function retouchImage(file: AdImageFile, customApiKey?: string): Promise<string> {
    const parts = [
      { inlineData: { data: file.base64, mimeType: file.mimeType } },
      { text: "Professional studio retouching. Enhance quality, lighting, and clarity while keeping the person's face identical." }
    ];
    try {
        const res = await generateContentWithRetry({
            model: IMAGE_EDIT_MODEL,
            contents: { parts }
        }, customApiKey);
        const imagePart = res.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (!imagePart?.inlineData?.data) throw new Error("Nano Banana không trả về dữ liệu ảnh.");
        return imagePart.inlineData.data;
    } catch (error) {
        throw handleGeminiError(error, "retouch ảnh");
    }
}

// Ad image generation using Nano Banana (gemini-2.5-flash-image)
export async function generateAdImage(formState: AdImageFormState, customApiKey?: string): Promise<string[]> {
    const { files, prompt, variations } = formState;
    
    const generateSingle = async () => {
        const parts: any[] = [];
        
        // Identity Preservation Rules for Nano Banana
        const identityInstruction = `
[IDENTITY LOCK - NANO BANA TECH]
1. Subject Reference: Use the uploaded image as the character model.
2. Face: KEEP 100% ORIGINAL. Do not modify eyes, nose, or face shape.
3. Context: Create a professional commercial image with this person.
4. Scene: ${prompt}.
5. Quality: High-end photorealistic studio lighting, 4k detail.`;

        files.forEach(file => {
            parts.push({ inlineData: { data: file.base64, mimeType: file.mimeType } });
            parts.push({ text: `Source person (${file.role}). Lock this face.` });
        });

        parts.push({ text: identityInstruction });

        const res = await generateContentWithRetry({
            model: IMAGE_EDIT_MODEL,
            contents: { parts },
            config: {
                // Nano Banana specific configs
                imageConfig: {
                    aspectRatio: "1:1"
                }
            }
        }, customApiKey);

        const imagePart = res.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (!imagePart?.inlineData?.data) throw new Error("Nano Banana không thể kết xuất hình ảnh.");
        return imagePart.inlineData.data;
    };

    try {
        const results = [];
        for (let i = 0; i < variations; i++) {
            results.push(await generateSingle());
        }
        return results;
    } catch (error) {
        throw handleGeminiError(error, "tạo ảnh quảng cáo");
    }
}

// --- Rest of the services using their appropriate models ---

export async function generateAffiliateScript(formState: AffiliateFormState, customApiKey?: string): Promise<AffiliateScriptResult> {
    const prompt = `Viết kịch bản Viral Affiliate cho ${formState.platform}. Sản phẩm: ${formState.productName}. USPs: ${formState.productFeatures}.`;
    try {
        const response = await generateContentWithRetry({
            model: GEMINI_PRO_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        scriptText: { type: Type.STRING },
                        masterFlowPrompt: { type: Type.STRING },
                        scenes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { scene: { type: Type.INTEGER }, description: { type: Type.STRING }, action: { type: Type.STRING }, dialogue: { type: Type.STRING }, prompt: { type: Type.STRING } } } }
                    }
                }
            }
        }, customApiKey);
        return parseJsonResponse<AffiliateScriptResult>(response.text, "tạo kịch bản affiliate");
    } catch (error) { throw handleGeminiError(error, "tạo kịch bản affiliate"); }
}

export async function generateStory(formState: StoryFormState, context: string, customApiKey?: string): Promise<StoryGenerationResponse> {
    const prompt = `Viết truyện chủ đề: ${formState.theme}`;
    try {
        const response = await generateContentWithRetry({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.OBJECT, properties: { story: { type: Type.OBJECT, properties: { synopsis: { type: Type.STRING }, storyText: { type: Type.STRING }, voiceProfile: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, gender: { type: Type.STRING }, tone: { type: Type.STRING }, speed: { type: Type.STRING }, readingNotes: { type: Type.STRING } } } } } } },
            }
        }, customApiKey);
        return parseJsonResponse<StoryGenerationResponse>(response.text, "tạo truyện");
    } catch (error) { throw handleGeminiError(error, "tạo truyện"); }
}

export async function generateScript(formState: ScriptFormState, customApiKey?: string): Promise<{ vietnameseScript: string }> {
    const prompt = `Viết kịch bản phim chuyên nghiệp. Chủ đề: ${formState.theme}. Phong cách: ${formState.script_style}.`;
    try {
        const response = await generateContentWithRetry({
            model: GEMINI_PRO_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        vietnameseScript: { type: Type.STRING }
                    }
                }
            }
        }, customApiKey);
        return parseJsonResponse<{ vietnameseScript: string }>(response.text, "tạo kịch bản");
    } catch (error) { throw handleGeminiError(error, "tạo kịch bản"); }
}

export async function generateAdIdeas(productInfo: string, customApiKey?: string): Promise<AdSuggestion[]> {
    const prompt = `Tạo 3 ý tưởng quảng cáo cho sản phẩm: ${productInfo}. Trả về tiêu đề, mô tả và prompt.`;
    try {
        const response = await generateContentWithRetry({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            prompt: { type: Type.STRING }
                        }
                    }
                }
            }
        }, customApiKey);
        return parseJsonResponse<AdSuggestion[]>(response.text, "tạo ý tưởng quảng cáo");
    } catch (error) { throw handleGeminiError(error, "tạo ý tưởng quảng cáo"); }
}

export async function generateArticleFromUrls(urls: string[], customApiKey?: string): Promise<ArticleData> {
    const prompt = `Tổng hợp nội dung từ các đường link sau để viết bài báo: ${urls.join(', ')}.`;
    try {
        const response = await generateContentWithRetry({
            model: GEMINI_PRO_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        vietnameseTitle: { type: Type.STRING },
                        englishTitle: { type: Type.STRING },
                        vietnameseArticle: { type: Type.STRING },
                        englishArticle: { type: Type.STRING },
                        socialMediaSummaryVI: { type: Type.STRING },
                        socialMediaSummaryEN: { type: Type.STRING },
                        imagePrompt: { type: Type.STRING }
                    }
                }
            }
        }, customApiKey);
        return parseJsonResponse<ArticleData>(response.text, "tổng hợp bài báo");
    } catch (error) { throw handleGeminiError(error, "tổng hợp bài báo"); }
}
