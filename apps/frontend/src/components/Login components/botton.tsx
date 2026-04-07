import {Button, CircularProgress, Stack} from "@mui/material";
import type { ComponentProps } from "react";

type BottonProps = {
    loading: boolean;
    disabled?: boolean;
    label: string;
    type?: NonNullable<ComponentProps<"button">["type"]>;
    onClick?: ComponentProps<"button">["onClick"];
};

export default function Botton({
    loading,
    disabled,
    label,
    type = "submit",
    onClick,
}: BottonProps) {
    const isDisabled = loading || Boolean(disabled);
    return (
        <Button type={type} onClick={onClick} fullWidth variant="contained" disabled={isDisabled}
            aria-busy={loading} aria-label={label} 
            sx={{ mt: 1.5, py: 1.1, textTransform: "none", fontWeight: 600 }}
    >
        { loading ? (
            <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} color="inherit" />
                <span>Loading...</span>
            </Stack>
        ) : (
            label
        )}
    </Button>
    );
}
