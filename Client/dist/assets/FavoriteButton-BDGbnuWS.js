import{r as f,j as r,H as u}from"./vendor-CYUReqW3.js";import{f as p}from"./main-Bq8BBwxL.js";const x=({productId:t,productName:i,size:l="md"})=>{const{isFavorite:n,toggleFavorite:c}=p(),[e,s]=f.useState(!1),o=n(t),m={sm:"w-5 h-5",md:"w-6 h-6",lg:"w-7 h-7"},d=async a=>{a.preventDefault(),a.stopPropagation(),s(!0),setTimeout(()=>s(!1),300);try{await c(t,i)}catch(h){console.error("Failed to toggle favorite:",h)}};return r.jsx("button",{onClick:d,className:`
        relative flex items-center justify-center p-1
        transition-all duration-200 group
        ${e?"scale-125":"scale-100"}
      `,"aria-label":o?"Remove from wishlist":"Add to wishlist",children:r.jsx(u,{className:`
          ${m[l]}
          transition-all duration-200 drop-shadow-sm
          ${o?"fill-red-400 text-red-400 drop-shadow-md":"text-gray-400 fill-none hover:text-white group-hover:text-white"}
          ${e?"scale-110":"scale-100"}
        `,strokeWidth:1.5})})};export{x as F};
