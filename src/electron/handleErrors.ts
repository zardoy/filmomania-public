import { shell } from "electron";
import unhandled from "electron-unhandled";

unhandled({
    reportButton: () => {
        void shell.openExternal(`https://github.com/zardoy/filmomania-public/issues`);
    }
});
