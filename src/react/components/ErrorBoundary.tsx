import React from "react";

import { Button, Grid, Typography } from "@mui/material";

export default class ErrorBoundary extends React.Component<{}, { hasError: boolean; }> {
    override state = {
        hasError: false
    };

    override componentDidCatch() {
        this.setState({
            hasError: true
        });
        // todo #3 report to server
    }

    override render() {
        if (this.state.hasError) {
            return <Grid container direction="column" justifyContent="space-between" alignItems="center" style={{ height: "100vh" }}>
                <Grid item>
                    <Typography variant="h3" align="center">App Crashed</Typography>
                </Grid>
                <Grid item container direction="column" alignItems="center">
                    {/* todo button roles */}
                    <Button
                        size="large"
                        variant="contained"
                        color="primary"
                        onClick={() => { location.hash = ""; location.reload(); }}
                    >
                        Reload app
                    </Button>
                    {/* TODO VERY HIGH */}
                    <Button>
                        Please, feel free to report this
                    </Button>
                </Grid>
                <Grid item />
            </Grid>;
        }

        return this.props.children;
    }
}

