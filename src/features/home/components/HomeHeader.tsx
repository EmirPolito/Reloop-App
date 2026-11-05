import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, View } from "react-native";

import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text, TextInput } from "@/features/shared/Text";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { showNoNotificationsAlert } from "@/utils/alerts";

/** Cabecera del inicio: logo, saludo, acceso al perfil, comunidad, buscador y notificaciones. */
export const HomeHeader = memo(function HomeHeader({
  profileName,
  profilePhoto,
  query,
  onChangeQuery,
  onOpenProfile,
  onClearCategory,
}: {
  profileName: string;
  profilePhoto: string | null;
  query: string;
  onChangeQuery: (query: string) => void;
  onOpenProfile: () => void;
  onClearCategory: () => void;
}) {
  const { styles, isDark } = useAppTheme();
  return (
    <View style={styles.feedHeader}>
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <Image
            accessibilityLabel="Logo ReLoop"
            source={require("@/assets/images/reloop-logo.png")}
            contentFit="contain"
            style={styles.brandLogo}
          />
        </View>
        <View style={styles.identityRow}>
          <Text numberOfLines={1} style={styles.greeting}>
            ¡Hola, {profileName}!
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil"
            onPress={onOpenProfile}
            style={styles.profileShortcut}
          >
            {profilePhoto ? (
              <Image
                source={{ uri: optimizedImageUrl(profilePhoto, 120) ?? profilePhoto }}
                contentFit="cover"
                style={styles.homeAvatar}
              />
            ) : (
              <AppIcon
                name="person"
                size={23}
                color={isDark ? "#FFFFFF" : "#0785FF"}
              />
            )}
          </Pressable>
        </View>
      </View>
      <View style={styles.notificationRow}>
        <Pressable style={styles.communityPill} accessibilityRole="button">
          <AppIcon name="location" size={13} color="#0785FF" />
          <Text style={styles.communityText}>UTSV</Text>
          <AppIcon name="chevronDown" size={12} color="#0785FF" />
        </Pressable>
        <View style={styles.searchRow}>
          <AppIcon
            name="search"
            size={16}
            color={isDark ? "#E3DEED" : "#828690"}
          />
          <TextInput
            accessibilityLabel="Buscar productos"
            value={query}
            onChangeText={onChangeQuery}
            placeholder="Buscar..."
            placeholderTextColor={isDark ? "#B3AEC0" : "#828690"}
            returnKeyType="search"
            style={styles.searchInput}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filtrar por categoría"
            onPress={onClearCategory}
            style={styles.filterButton}
          >
            <AppIcon name="filter" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notificaciones"
          onPress={showNoNotificationsAlert}
          style={[styles.communityPill, styles.notificationButton]}
        >
          <AppIcon
            name="notifications"
            size={15}
            color={isDark ? "#FFFFFF" : "#23242C"}
          />
        </Pressable>
      </View>
    </View>
  );
});
