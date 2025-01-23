import React from "react";

import { Typography } from "@mui/material";

import SearchBox from "../components/SearchBox";
import Footer from "../components/Footer";
import Switches from '../components/Switches';

interface ComponentProps {
}

let HomePage: React.FC<ComponentProps> = () => {
    return <div className='flex flex-col justify-between h-screen'>
        <div className='flex flex-col'>
            <Typography sx={{ fontWeight: 900 }} variant="h1" align="center">FILMOMANIA</Typography>
            <SearchBox />
        </div>
        <div>
            <Switches />
            <Footer />
        </div>
    </div>;
};

export default HomePage;
