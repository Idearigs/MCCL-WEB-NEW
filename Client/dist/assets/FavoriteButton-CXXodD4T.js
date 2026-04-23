import{r as p,j as r,H as g}from"./vendor-D4DSpbSH.js";import{f as v}from"./main-BvEIWg7I.js";const F=({productId:t,productName:i,imageUrl:l,productUrl:n,size:c="md"})=>{const{isFavorite:m,toggleFavorite:d}=v(),[e,s]=p.useState(!1),o=m(t),h={sm:"w-5 h-5",md:"w-6 h-6",lg:"w-7 h-7"},f=async a=>{a.preventDefault(),a.stopPropagation(),s(!0),setTimeout(()=>s(!1),300);try{await d(t,i,l,n)}catch(u){console.error("Failed to toggle favorite:",u)}};return r.jsx("button",{onClick:f,className:`
        relative flex items-center justify-center p-1
        transition-all duration-200 group
        ${e?"scale-125":"scale-100"}
      `,"aria-label":o?"Remove from wishlist":"Add to wishlist",children:r.jsx(g,{className:`
          ${h[c]}
          transition-all duration-200 drop-shadow-sm
          ${o?"fill-red-400 text-red-400 drop-shadow-md":"text-gray-400 fill-none hover:text-white group-hover:text-white"}
          ${e?"scale-110":"scale-100"}
        `,strokeWidth:1.5})})};export{F};
