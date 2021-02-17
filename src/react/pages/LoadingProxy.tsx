/* eslint-disable quote-props */
import React, { useState } from "react";

import { motion, useAnimation } from "framer-motion";
import _ from "lodash";

import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles({
    root: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "black",
        "& > p": {
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: "14px",
            color: "lime"
        }
    },
});

interface IpAddressProps {
}

const IpAddress: React.FC<IpAddressProps> = ({ children }) => {
    const expectedMaxSize = {
        width: 250,
        height: 50
    };
    const [[x, y]] = useState([
        _.random(0, window.innerWidth - expectedMaxSize.width),
        _.random(0, window.innerHeight - expectedMaxSize.height)
    ]);

    const animation = useAnimation();

    return <motion.p
        initial={{
            opacity: 0
        }}
        animate={{
            opacity: 1,
            transition: {
                duration: 2
            }
        }}
        style={{
            position: "fixed",
            left: x,
            top: y
        }}
    >{children}</motion.p>;
};

let LoadingProxy: React.FC = () => {
    const classes = useStyles();

    // todo alg
    return <div className={classes.root}>
        {
            _.times(20, index => <IpAddress key={index} />)
        }
    </div>;
};

export default LoadingProxy;
