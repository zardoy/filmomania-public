import React from "react";

interface ComponentProps {
}

const FilmPage: React.FC<ComponentProps> = () => {
    // const { filmId: selectedFilmId } = useParams<{ filmId: string; }>();

    // const films = [];
    // const state = useAsync(async () => {
    //     const filmInfo = films.find(({ filmId }) => filmId === +selectedFilmId);
    //     if (!filmInfo) {
    //         // todo high
    //         throw new Error("Perform search again.");
    //     }
    //     const { cleanName, ...rest } = filmInfo;
    //     const yearForSearch = rest.type === "film" ? rest.year : rest.yearFrom;
    //     try {
    //         const result = await typedIpcRenderer.request("torrentsList", {
    //             searchQuery: `${cleanName} ${yearForSearch}`
    //         });
    //         if ("error" in result) throw new Error(result.error);
    //         return result.parseResult;
    //     } catch (err) {
    //         throw new Error(`${err.message}\nTry to CTRL+R to find another proxy`);
    //     }
    // }, []);
    // const routerHistory = useHistory();
    // const moreOptionsPopoverState = usePopupState({ variant: "popover", popupId: "torrentIdMoreOptions" });




    // //fsdkf;'s'
    // const [dropdownTorrentIndex, setDropdownTorrentIndex] = useState<[string, string]>(["", ""]);

    // return !state.value ?
    //     <CenterContent>
    //         {
    //             state.loading ? <CircularProgress /> :
    //                 <>
    //                     <Typography color="error">{state.error?.message}</Typography>
    //                 </>
    //         }
    //     </CenterContent> :
    //     <Grid container direction="column">
    //         <Popper
    //             {...bindPopover(moreOptionsPopoverState)}
    //         >
    //             <Paper>
    //                 <ClickAwayListener onClickAway={moreOptionsPopoverState.close}>
    //                     <MenuList>
    //                         <MenuItem onClick={() => {
    //                             // void shell.openExternal(dropdownTorrentIndex[0]);
    //                         }}>
    //                             <ListItemIcon>
    //                                 <OpenInBrowserIcon />
    //                             </ListItemIcon>
    //                             <Typography variant="inherit">Open torrent page</Typography>
    //                         </MenuItem>
    //                         <MenuItem onClick={() => {
    //                             typedIpcRenderer.send("downloadAndOpenTorrentFile", {
    //                                 torrentFileUrl: dropdownTorrentIndex[1]
    //                             });
    //                         }}>
    //                             <ListItemIcon>
    //                                 <LaunchIcon />
    //                             </ListItemIcon>
    //                             <Typography variant="inherit">Open .torrent file</Typography>
    //                         </MenuItem>
    //                     </MenuList>
    //                 </ClickAwayListener>
    //             </Paper>
    //         </Popper>
    //         <Typography variant="h4">Results from rutor.info: {state.value.totalResults}</Typography>
    //         {
    //             state.value.hiddenResults > 0 &&
    //             <Alert severity="warning">We have hidden results: {state.value.hiddenResults}</Alert>
    //         }
    //         <List>{
    //             state.value.results.length ?
    //                 _.sortBy(state.value.results, o => o.sizeInBytes).reverse().map(({ title, magnet, torrentID, seeders, displaySize, pageURL, torrentURL }) => {
    //                     const playTorrent = async () => {
    //                         typedIpcRenderer.send("playTorrent", {
    //                             player: await settingsStore.get("player", "defaultPlayer"),
    //                             magnet
    //                         });
    //                     };
    //                     const contextM = (event: React.MouseEvent<HTMLElement>) => {
    //                         setDropdownTorrentIndex([pageURL, torrentURL]);
    //                         moreOptionsPopoverState.open(event);
    //                     };
    //                     return <ListItem key={torrentID} divider button onClick={playTorrent} onContextMenu={contextM}>
    //                         <Grid container justify="space-between" wrap="nowrap">
    //                             <Typography>{title}</Typography>
    //                             <div style={{ float: "right", display: "flex" }}>
    //                                 <Typography style={{ color: seeders === 0 ? "red" : seeders < 8 ? "yellow" : "limegreen" }}>{seeders}</Typography>
    //                                 <Typography style={{ marginLeft: 15 }}>{displaySize}</Typography>
    //                             </div>
    //                         </Grid>
    //                     </ListItem>;
    //                 })
    //                 : <Typography>No results on rutor.info!</Typography>
    //         }</List>
    //     </Grid>;
    return null;
};

export default FilmPage;
