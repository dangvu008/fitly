// Map error codes to fix suggestions for body images
export const bodyImageFixSuggestions: Record<string, { vi: string; en: string }> = {
  'image_too_small': {
    vi: '💡 Gợi ý: Chụp ảnh gần hơn hoặc sử dụng camera có độ phân giải cao hơn',
    en: '💡 Tip: Take a closer photo or use a higher resolution camera'
  },
  'no_person': {
    vi: '💡 Gợi ý: Đảm bảo bạn đứng trong khung hình, nên nhờ người khác chụp hoặc dùng timer',
    en: '💡 Tip: Make sure you are in the frame, ask someone to take the photo or use a timer'
  },
  'not_full_body': {
    vi: '💡 Gợi ý: Lùi xa camera để toàn bộ cơ thể từ đầu đến chân hiển thị trong ảnh',
    en: '💡 Tip: Step back from the camera so your full body from head to feet is visible'
  },
  'poor_quality': {
    vi: '💡 Gợi ý: Chụp ở nơi có ánh sáng tốt, giữ điện thoại/camera ổn định, tránh rung lắc',
    en: '💡 Tip: Take photo in good lighting, hold your phone/camera steady, avoid shaking'
  },
  'too_blurry': {
    vi: '💡 Gợi ý: Giữ camera ổn định, đảm bảo focus đúng vào người, tránh di chuyển khi chụp',
    en: '💡 Tip: Hold camera steady, ensure focus is on the person, avoid moving while shooting'
  },
  'too_dark': {
    vi: '💡 Gợi ý: Chụp ở nơi có nhiều ánh sáng tự nhiên hoặc bật đèn flash',
    en: '💡 Tip: Take photo in a well-lit area or turn on flash'
  },
  'face_not_visible': {
    vi: '💡 Gợi ý: Quay mặt về phía camera, không che mặt bằng tay hoặc vật khác',
    en: '💡 Tip: Face the camera, do not cover your face with hands or objects'
  },
  'multiple_people': {
    vi: '💡 Gợi ý: Chỉ 1 người trong ảnh, nhờ người khác ra khỏi khung hình',
    en: '💡 Tip: Only 1 person should be in the photo, ask others to step out of frame'
  },
  'cropped_body': {
    vi: '💡 Gợi ý: Đảm bảo không bị cắt tay, chân, đầu - lùi xa camera hoặc xoay ngang điện thoại',
    en: '💡 Tip: Make sure arms, legs, head are not cut off - step back or rotate phone horizontally'
  },
  'default': {
    vi: '💡 Gợi ý: Chụp ảnh toàn thân rõ nét, đứng thẳng, ánh sáng tốt, nền đơn giản',
    en: '💡 Tip: Take a clear full-body photo, stand straight, good lighting, simple background'
  }
};

// Map error codes to fix suggestions for clothing images
export const clothingFixSuggestions: Record<string, { vi: string; en: string }> = {
  'not_clothing': {
    vi: '💡 Gợi ý: Chỉ tải ảnh quần áo, giày dép hoặc phụ kiện thời trang',
    en: '💡 Tip: Only upload photos of clothing, shoes, or fashion accessories'
  },
  'folded': {
    vi: '💡 Gợi ý: Trải phẳng quần áo trên bề mặt phẳng hoặc treo lên móc trước khi chụp',
    en: '💡 Tip: Lay the clothing flat on a surface or hang it on a hanger before taking a photo'
  },
  'crumpled': {
    vi: '💡 Gợi ý: Là/ủi quần áo trước khi chụp, trải phẳng trên nền trắng',
    en: '💡 Tip: Iron the clothing before taking a photo, lay flat on a white background'
  },
  'partially_visible': {
    vi: '💡 Gợi ý: Đảm bảo toàn bộ quần áo nằm trong khung hình, không bị cắt xén',
    en: '💡 Tip: Make sure the entire clothing item is within the frame, not cropped'
  },
  'in_packaging': {
    vi: '💡 Gợi ý: Lấy quần áo ra khỏi bao bì/túi, trải phẳng rồi chụp',
    en: '💡 Tip: Remove clothing from packaging/bag, lay flat and then take a photo'
  },
  'multiple_items': {
    vi: '💡 Gợi ý: Chỉ chụp 1 món đồ mỗi lần, tách riêng từng món để AI nhận diện chính xác',
    en: '💡 Tip: Only photograph 1 item at a time, separate items for accurate AI recognition'
  },
  'worn_by_person': {
    vi: '💡 Gợi ý: Cởi quần áo ra và trải phẳng, không chụp khi đang mặc trên người',
    en: '💡 Tip: Take off the clothing and lay it flat, do not photograph while wearing it'
  },
  'too_blurry': {
    vi: '💡 Gợi ý: Giữ camera ổn định, chụp trong ánh sáng tốt, đảm bảo focus rõ nét',
    en: '💡 Tip: Hold camera steady, shoot in good light, ensure sharp focus'
  },
  'bad_lighting': {
    vi: '💡 Gợi ý: Chụp gần cửa sổ hoặc dưới đèn sáng, tránh bóng đổ trên quần áo',
    en: '💡 Tip: Take photo near a window or under bright light, avoid shadows on clothing'
  },
  'too_small': {
    vi: '💡 Gợi ý: Chụp gần hơn để quần áo chiếm phần lớn khung hình',
    en: '💡 Tip: Take a closer photo so the clothing fills most of the frame'
  },
  'background_cluttered': {
    vi: '💡 Gợi ý: Đặt quần áo trên nền trắng hoặc đơn màu, dọn sạch vật xung quanh',
    en: '💡 Tip: Place clothing on a white or solid color background, clear surrounding objects'
  },
  'poor_quality': {
    vi: '💡 Gợi ý: Chụp ảnh rõ nét với camera chất lượng cao, ánh sáng đầy đủ',
    en: '💡 Tip: Take a clear photo with a quality camera in good lighting'
  },
  'image_too_small': {
    vi: '💡 Gợi ý: Sử dụng ảnh có độ phân giải cao hơn (tối thiểu 100x100px)',
    en: '💡 Tip: Use a higher resolution image (minimum 100x100px)'
  },
  'default': {
    vi: '💡 Gợi ý: Trải phẳng quần áo trên nền trắng, ánh sáng tốt, chụp thẳng từ trên xuống',
    en: '💡 Tip: Lay clothing flat on white background, good lighting, shoot straight down'
  }
};

// Get fix suggestion based on error code
export const getBodyImageFixSuggestion = (errorCode: string, language: 'vi' | 'en'): string => {
  // Normalize error code
  const normalizedCode = errorCode.toLowerCase().replace(/\s+/g, '_');
  
  // Check for partial matches
  for (const [key, suggestion] of Object.entries(bodyImageFixSuggestions)) {
    if (normalizedCode.includes(key) || key.includes(normalizedCode)) {
      return suggestion[language];
    }
  }
  
  return bodyImageFixSuggestions.default[language];
};

export const getClothingFixSuggestion = (errorCode: string, language: 'vi' | 'en'): string => {
  // Normalize error code
  const normalizedCode = errorCode.toLowerCase().replace(/\s+/g, '_');
  
  // Check for partial matches
  for (const [key, suggestion] of Object.entries(clothingFixSuggestions)) {
    if (normalizedCode.includes(key) || key.includes(normalizedCode)) {
      return suggestion[language];
    }
  }
  
  return clothingFixSuggestions.default[language];
};

// Get all fix suggestions for multiple errors
export const getBodyImageFixSuggestions = (errors: string[], language: 'vi' | 'en'): string[] => {
  const suggestions = new Set<string>();
  
  for (const error of errors) {
    suggestions.add(getBodyImageFixSuggestion(error, language));
  }
  
  return Array.from(suggestions);
};

export const getClothingFixSuggestions = (errors: string[], language: 'vi' | 'en'): string[] => {
  const suggestions = new Set<string>();
  
  for (const error of errors) {
    suggestions.add(getClothingFixSuggestion(error, language));
  }
  
  return Array.from(suggestions);
};
