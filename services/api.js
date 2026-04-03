const rawApiUrl = typeof window !== "undefined" && window.location.hostname !== "localhost"
  ? process.env.NEXT_PUBLIC_API_URL 
  : "http://localhost:5000";

export const API_BASE_URL = rawApiUrl?.replace(/\/api\/?$/, "");
export const API_URL = `${API_BASE_URL}/api`;

export const getHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
};

export const registerUser = async (data) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const loginUser = async (data) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const forgotPassword = async (email) => {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  return res.json();
};

export const resetPassword = async (data) => {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const createProduct = async (formData) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/products/create`, {
    method: "POST",
    headers: {
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
    body: formData
  });
  return res.json();
};

export const updateProduct = async (id, formData) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/products/update/${id}`, {
    method: "PUT",
    headers: {
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
    body: formData
  });
  return res.json();
};

export const deleteProduct = async (id) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/products/delete/${id}`, {
    method: "DELETE",
    headers: {
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    }
  });
  return res.json();
};

export const getMyListings = async (userId) => {
  const res = await fetch(`${API_URL}/products/my-listings/${userId}`);
  return res.json();
};

export const updateProductStatus = async (id, status) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/products/status/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ status })
  });
  return res.json();
};

export const getCategories = async () => {
  const res = await fetch(`${API_URL}/products/categories`);
  return res.json();
};

export const getBrands = async () => {
  const res = await fetch(`${API_URL}/products/brands`);
  return res.json();
};

// User Profile & Activity
export const getUserProfile = async (id) => {
  const res = await fetch(`${API_URL}/user/profile/${id}`);
  return res.json();
};

export const updateUserProfile = async (id, data) => {
  const res = await fetch(`${API_URL}/user/profile/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const getUserActivity = async (id) => {
  const res = await fetch(`${API_URL}/user/activity/${id}`);
  return res.json();
};

// Watch Vault
export const getWatchVault = async (userId) => {
  const res = await fetch(`${API_URL}/user/vault/${userId}`);
  return res.json();
};

export const addToVault = async (data) => {
  const res = await fetch(`${API_URL}/user/vault/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
};

// Chat System
export const createChat = async (product_id, buyer_id, seller_id) => {
  const res = await fetch(`${API_URL}/chat/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id, buyer_id, seller_id })
  });
  return res.json();
};

export const getUserChats = async (userId) => {
  const res = await fetch(`${API_URL}/chat/user/${userId}`);
  return res.json();
};

export const getChatMessages = async (chatId) => {
  const res = await fetch(`${API_URL}/chat/messages/${chatId}`);
  return res.json();
};

export const sendChatMessage = async (chat_id, sender_id, message, type = 'text', metadata = {}) => {
  const res = await fetch(`${API_URL}/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id, sender_id, message, type, metadata })
  });
  return res.json();
};

export const updateMessageStatus = async (messageId, status) => {
  const res = await fetch(`${API_URL}/chat/message/${messageId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ metadata: { status } })
  });
  return res.json();
};

export const markChatAsRead = async (chatId, userId) => {
  const res = await fetch(`${API_URL}/chat/${chatId}/read`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });
  return res.json();
};

export const getTotalUnreadCount = async (userId) => {
  const res = await fetch(`${API_URL}/chat/unread/count/${userId}`);
  return res.json();
};

export const uploadChatImage = async (formData) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/chat/upload`, {
    method: "POST",
    headers: {
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
    body: formData
  });
  return res.json();
};

// Review System
export const getSellerReviews = async (sellerId) => {
  const res = await fetch(`${API_URL}/reviews/seller/${sellerId}`);
  return res.json();
};

export const createReview = async (reviewData) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify(reviewData)
  });
  return res.json();
};

// Orders - Sale Confirmation Flow (7-Stage State Machine)
export const markOrderShipped = async (dealId, sellerId, trackingData) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/orders/${dealId}/shipped`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ seller_id: sellerId, ...trackingData })
  });
  return res.json();
};

export const markOrderDelivered = async (dealId, sellerId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/orders/${dealId}/delivered`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ seller_id: sellerId })
  });
  return res.json();
};

export const confirmOrderReceived = async (dealId, buyerId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/orders/${dealId}/confirm-received`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ buyer_id: buyerId })
  });
  return res.json();
};

export const confirmOrderSale = async (dealId, buyerId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/orders/${dealId}/confirm-sale`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ buyer_id: buyerId })
  });
  return res.json();
};

export const markOrderPaid = async (dealId, buyerId, method, receiptFile = null) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("buyer_id", buyerId);
  formData.append("payment_method", method);
  if (receiptFile) {
    formData.append("receipt", receiptFile);
  }

  const res = await fetch(`${API_URL}/orders/${dealId}/mark-paid`, {
    method: "PATCH",
    headers: {
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: formData
  });
  return res.json();
};

export const cancelDeal = async (dealId, userId, reason) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/orders/${dealId}/cancel`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ user_id: userId, reason })
  });
  return res.json();
};

export const disputeDeal = async (dealId, userId, reason) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/orders/${dealId}/dispute`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ user_id: userId, reason })
  });
  return res.json();
};

export const markOrderReturned = async (dealId, sellerId, reason) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/orders/${dealId}/returned`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ seller_id: seller_id, reason })
  });
  return res.json();
};

export const getOfferHistory = async (offerId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/offers/${offerId}/history`, {
    headers: {
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    }
  });
  return res.json();
};

export const getUserDeals = async (userId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/orders/user-deals/${userId}`, {
    headers: {
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    }
  });
  return res.json();
};

// Reports
export const createReport = async (reportData) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify(reportData)
  });
  return res.json();
};

// Notifications
export const getNotifications = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/notifications`, {
    headers: {
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    }
  });
  return res.json();
};

export const markNotificationAsRead = async (id) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/notifications/${id}/read`, {
    method: "PUT",
    headers: {
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    }
  });
  return res.json();
};

export const markAllNotificationsAsRead = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/notifications/mark-all-read`, {
    method: "PUT",
    headers: {
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    }
  });
  return res.json();
};

// Dynamic Labels & Replies
export const getUiLabels = async () => {
  const res = await fetch(`${API_URL}/labels/ui-labels`);
  return res.json();
};

export const getQuickReplies = async () => {
  const res = await fetch(`${API_URL}/labels/quick-replies`);
  return res.json();
};

export const confirmDirectDeal = async (chat_id, seller_id, final_price) => {
  const res = await fetch(`${API_URL}/chat/confirm-direct-deal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id, seller_id, final_price })
  });
  return res.json();
};

// Platform Settings & Terms
export const getTerms = async () => {
  const res = await fetch(`${API_URL}/user/terms`);
  return res.json();
};

export const acceptTerms = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/user/accept-terms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    }
  });
  return res.json();
};

export const updatePlatformSetting = async (key, value) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/admin/settings`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ key, value })
  });
  return res.json();
};

export const createOffer = async (offerData) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/offers/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify(offerData)
  });
  return res.json();
};

export const respondToOffer = async (offerId, status, counter_amount = null) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/offers/${offerId}/respond`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ status, counter_amount })
  });
  return res.json();
};