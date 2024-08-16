import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
export default defineConfig({
    plugins: [react()],
    server:{
        proxy:{
            "/api/v1":{
                target:"http://localhost:8000",
                secure:false,
                changeOrigin:true,
            }
            
        }
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
