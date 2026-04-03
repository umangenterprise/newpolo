let activeSellerSession = null;

export const isSellerSessionActive = () => Boolean(activeSellerSession);

export const getActiveSellerSession = () => activeSellerSession;

export const activateSellerSession = (user) => {
  activeSellerSession = {
    userId: user._id.toString(),
    email: user.email
  };
};

export const clearSellerSession = () => {
  activeSellerSession = null;
};

