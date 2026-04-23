import{r as u,j as r,H as p}from"./vendor-D4DSpbSH.js";import{f as g}from"./main-DGY5JaiY.js";const w=({productId:t,productName:i,imageUrl:l,size:n="md"})=>{const{isFavorite:c,toggleFavorite:m}=g(),[e,s]=u.useState(!1),o=c(t),d={sm:"w-5 h-5",md:"w-6 h-6",lg:"w-7 h-7"},h=async a=>{a.preventDefault(),a.stopPropagation(),s(!0),setTimeout(()=>s(!1),300);try{await m(t,i,l)}catch(f){console.error("Failed to toggle favorite:",f)}};return r.jsx("button",{onClick:h,className:`
        relative flex items-center justify-center p-1
        transition-all duration-200 group
        ${e?"scale-125":"scale-100"}
      `,"aria-label":o?"Remove from wishlist":"Add to wishlist",children:r.jsx(p,{className:`
          ${d[n]}
          transition-all duration-200 drop-shadow-sm
          ${o?"fill-red-400 text-red-400 drop-shadow-md":"text-gray-400 fill-none hover:text-white group-hover:text-white"}
          ${e?"scale-110":"scale-100"}
        `,strokeWidth:1.5})})};export{w as F};
