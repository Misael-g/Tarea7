import { StyleSheet } from "react-native";
import { borderRadius, colors, fontSize, shadows, spacing } from "./theme";

export const globalStyles = StyleSheet.create({
  // ============= CONTENEDORES =============
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  containerCentered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  contentPadding: {
    padding: spacing.lg,
  },

  scrollContent: {
    padding: spacing.md,
  },

  // ============= INPUTS =============
  input: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },

  inputMultiline: {
    height: 100,
    textAlignVertical: "top",
  },

  inputError: {
    borderColor: colors.error,
  },

  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  // ============= BOTONES =============
  button: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },

  buttonPrimary: {
    backgroundColor: colors.primary,
  },

  buttonSecondary: {
    backgroundColor: colors.secondary,
  },

  buttonAccent: {
    backgroundColor: colors.accent,
  },

  buttonDanger: {
    backgroundColor: colors.error,
  },

  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.primary,
  },

  buttonDisabled: {
    backgroundColor: colors.borderLight,
    opacity: 0.6,
  },

  buttonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "600",
  },

  buttonTextOutline: {
    color: colors.primary,
  },

  buttonSmall: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  buttonLarge: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },

  // ============= TARJETAS =============
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },

  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: colors.textPrimary,
  },

  cardSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  cardImage: {
    width: "100%",
    height: 200,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },

  cardActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  // ============= TEXTOS =============
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  subtitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  textPrimary: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },

  textSecondary: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  textTertiary: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },

  textBold: {
    fontWeight: "600",
  },

  textCenter: {
    textAlign: "center",
  },

  // ============= HEADER =============
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.small,
  },

  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.textPrimary,
  },

  // ============= BADGES / CHIPS =============
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    gap: spacing.xs,
  },

  chipText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: "500",
  },

  badge: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.round,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },

  badgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: "bold",
  },

  // ============= NIVELES =============
  nivelPrincipiante: {
    backgroundColor: colors.principiante,
  },

  nivelIntermedio: {
    backgroundColor: colors.intermedio,
  },

  nivelAvanzado: {
    backgroundColor: colors.avanzado,
  },

  // ============= ESTADOS =============
  emptyState: {
    textAlign: "center",
    marginTop: spacing.xxl,
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  errorContainer: {
    backgroundColor: colors.error,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },

  errorText: {
    color: colors.white,
    fontSize: fontSize.sm,
  },

  successContainer: {
    backgroundColor: colors.success,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },

  successText: {
    color: colors.white,
    fontSize: fontSize.sm,
  },

  // ============= LISTAS =============
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },

  listItemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },

  listItemTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  listItemSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // ============= SEPARADORES =============
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },

  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  // ============= MODALES =============
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },

  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 400,
    ...shadows.large,
  },

  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  // ============= ROW / COLUMN =============
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  column: {
    flexDirection: "column",
    gap: spacing.sm,
  },

  // ============= STATS / MÉTRICAS =============
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    ...shadows.small,
  },

  statValue: {
    fontSize: fontSize.xxxl,
    fontWeight: "bold",
    color: colors.primary,
  },

  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});