import { shell } from "electron";
import unhandled from "electron-unhandled";

unhandled({
    reportButton: () => {
        void shell.openExternal(process.env.GITHUB_ISSUES_URL!);
    }
});
