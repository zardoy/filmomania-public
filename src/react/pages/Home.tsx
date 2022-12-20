import React from "react";

import { Typography } from "@mui/material";

import SearchBox from "../components/SearchBox";
import Footer from "../components/Footer";

interface ComponentProps {
}

let HomePage: React.FC<ComponentProps> = () => {
    return <div className='flex flex-col justify-between h-screen'>
        <div className='flex flex-col'>
            <Typography sx={{ fontWeight: 900 }} variant="h1" align="center">FILMOMANIA</Typography>
            <SearchBox />
        </div>
        <Footer />
    </div>;
};

export default HomePage;
