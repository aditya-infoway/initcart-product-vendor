import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { decryptData } from "./reusable";
import { useNavigate } from "react-router-dom";

//Toast massage
export function toasterrormsg(message: any) {
  toast.error(message, {
    position: "top-right",
    autoClose: 1000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
  });
}

export function toastsuccessmsg(message: any) {
  toast.success(message, {
    position: "top-right",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
  });
}

//url
export const URL = {
  uaturl: "",
  productionurl: "",
  uatgogagnerurl: "",
};
//get the x-token if store in session
const xToken =
  sessionStorage.getItem("x-token") &&
  decryptData(sessionStorage.getItem("x-token"));

// API HEADER
// headers for api
function Header(useHeader: any) {
  return useHeader
    ? {
        headers: {
          "x-token": xToken,
          authorization: "h51hEo215kf32JQJInhV4WjA?A8olpMZ4dFx5dS5KlPuXailDln!LcvMxxb1a7Zx",
          "Content-Type": "multipart/form-data",
          "elevel": 0,
        },
      }
    : {
        headers: {
          "x-token": xToken,
          authorization: "h51hEo215kf32JQJInhV4WjA?A8olpMZ4dFx5dS5KlPuXailDln!LcvMxxb1a7Zx",
          "Content-Type": "application/json",
          "elevel": 0,
        },
      };
}
//header for delete method
function Header_delete(useHeader: any) {
  return useHeader
    ? {
        "x-token": xToken,
        authorization: "h51hEo215kf32JQJInhV4WjA?A8olpMZ4dFx5dS5KlPuXailDln!LcvMxxb1a7Zx",
        "Content-Type": "multipart/form-data",
        "elevel": 0,
      }
    : {
        "x-token": xToken,
        authorization: "h51hEo215kf32JQJInhV4WjA?A8olpMZ4dFx5dS5KlPuXailDln!LcvMxxb1a7Zx",
        "Content-Type": "application/json",
        "elevel": 0,
      };
}

//Logout


const Logout=()=> {
    sessionStorage.clear()
    location.reload()
}

export const Post = async (fileName: string, data: any, useHeader: any) => {
    try {
      const url = `${URL.uatgogagnerurl}${fileName}`;
      const response = await axios.post(url, data, Header(useHeader));
  
      if (response.data.status == 403) {
        console.log("hshshsh");
        
        Logout();
      }
  
      return response;
    } catch (error) {
      console.log("Error fetching data: ", error);
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        Logout();
      }
      throw error;
    }
  };
  
  // API CALL for DELETE method
  export const Delete = async (fileName: string, data: any, useHeader: any) => {
    try {
      const header = Header_delete(useHeader);
      const url = `${URL.uatgogagnerurl}${fileName}`;
      const response = await axios.delete(url, { data: data, headers: header });
  
      if (response.data.status === 403) {
        Logout();
      }
  
      return response;
    } catch (error) {
      console.error("There was an error deleting the data:", error);
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        Logout();
      }
      throw error;
    }
  };
  
  // API CALL for PATCH method
  export const Patch = async (fileName: string, data: any, useHeader: any) => {
    try {
      const url = `${URL.uatgogagnerurl}${fileName}`;
      const response = await axios.patch(url, data, Header(useHeader));
      console.log(response, "ppppsssss");
  
      if (response.data.status === 403) {
        Logout();
      }
  
      return response;
    } catch (error) {
      console.log("Error fetching data: ", error);
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        Logout();
      }
      throw error;
    }
  };
  
  // API CALL for GET method
  export const Get = async (fileName: string, data: any, useHeader: any) => {
    try {
      const url = `${URL.uatgogagnerurl}${fileName}`;
      const response = await axios.get(url, { params: data, ...Header(useHeader) });
  
      if (response.data.status === 403) {
        Logout();
      }
  
      return response;
    } catch (error) {
      console.error("Error fetching data: ", error);
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        Logout();
      }
      throw error;
    }
  };
  
  // API CALL for PUT method
  export const Put = async (fileName: string, data: any, useHeader: any) => {
    try {
      const url = `${URL.uatgogagnerurl}${fileName}`;
      const response = await axios.put(url, data, Header(useHeader));
      console.log(response, "ppppsssss");
  
      if (response.data.status === 403) {
        Logout();
      }
  
      return response;
    } catch (error) {
      console.log("Error fetching data: ", error);
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        Logout();
      }
      throw error;
    }
  };
