import React from "react";

interface ComponentProps {
}

// todo-moderate component
let CenterContent: React.FC<ComponentProps> = ({ children }) =>
    <div className="flex justify-center flex-col items-center h-screen">{children}</div>;

export default CenterContent;
