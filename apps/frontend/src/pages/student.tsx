import { Box, Card, CardContent, Typography } from "@mui/material";
import ButtonUsage from '../components/example'

export default function StudentPage() {
	return (
		<Box sx={{ p: 3 }}>
			<Card sx={{ mb: 2 }}>
				<CardContent>
					<Typography variant="h5" fontWeight={700}>
						Student Home
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
						Login successful. You are now on the student page.
					</Typography>
				</CardContent>
			</Card>
			<ButtonUsage />
		</Box>
	)
}