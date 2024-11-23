
export const isLoggedIn = () => {
    return localStorage.getItem("authToken") !== null;

  };
  