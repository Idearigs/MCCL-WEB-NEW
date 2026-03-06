import{r as f,j as a}from"./vendor-react-DjRnKupO.js";import{e as p}from"./main-zh1VnBfy.js";import{L as u}from"./vendor-misc-Tm6iRViK.js";const w=({productId:t,productName:i,size:l="md"})=>{const{isFavorite:n,toggleFavorite:c}=p(),[e,o]=f.useState(!1),s=n(t),m={sm:"w-5 h-5",md:"w-6 h-6",lg:"w-7 h-7"},d=async r=>{r.preventDefault(),r.stopPropagation(),o(!0),setTimeout(()=>o(!1),300);try{await c(t,i)}catch(h){console.error("Failed to toggle favorite:",h)}};return a.jsx("button",{onClick:d,className:`
        relative flex items-center justify-center p-1
        transition-all duration-200 group
        ${e?"scale-125":"scale-100"}
      `,"aria-label":s?"Remove from wishlist":"Add to wishlist",children:a.jsx(u,{className:`
          ${m[l]}
          transition-all duration-200 drop-shadow-sm
          ${s?"fill-red-400 text-red-400 drop-shadow-md":"text-gray-400 fill-none hover:text-white group-hover:text-white"}
          ${e?"scale-110":"scale-100"}
        `,strokeWidth:1.5})})};export{w as F};
