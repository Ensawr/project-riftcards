import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui';
import { cardImageUrl } from '@/features/catalog/constants';
import { useTheme } from '@/theme';

type CardImageProps = {
  imageId: string | null;
  name: string;
  /** OpenRift image size: thumbnails use 240w, detail screens 400w/full. */
  size?: '120w' | '240w' | '400w' | 'full';
  rounded?: number;
  /**
   * Battlefield cards are printed landscape. In a portrait frame (grids, binders)
   * the art is rotated 90° so the whole card is visible at the same tile size.
   */
  landscape?: boolean;
  /** Show landscape cards in their natural horizontal frame instead of rotating them (detail screen). */
  naturalOrientation?: boolean;
};

/** Card art loaded from OpenRift and cached on disk by expo-image (never bulk-mirrored). */
export function CardImage({ imageId, name, size = '240w', rounded, landscape = false, naturalOrientation = false }: CardImageProps) {
  const theme = useTheme();
  const uri = cardImageUrl(imageId, size);
  const radius = rounded ?? theme.radius.sm;
  const [frame, setFrame] = useState<{ width: number; height: number } | null>(null);

  const rotate = landscape && !naturalOrientation;
  const aspectRatio = landscape && naturalOrientation ? 1 / theme.sizes.cardAspect : theme.sizes.cardAspect;

  const image = (style: object) =>
    uri ? (
      <Image
        source={{ uri }}
        style={style}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={160}
        recyclingKey={uri}
        accessibilityLabel={name}
      />
    ) : null;

  return (
    <View
      onLayout={rotate ? (event) => setFrame(event.nativeEvent.layout) : undefined}
      style={[styles.frame, { aspectRatio, borderRadius: radius, backgroundColor: theme.colors.surfaceMuted }]}>
      {!uri ? (
        <View style={styles.placeholder}>
          <Icon name="image-outline" size={theme.sizes.iconLg} color="textMuted" />
        </View>
      ) : rotate ? (
        frame
          ? image({
              position: 'absolute',
              width: frame.height,
              height: frame.width,
              left: (frame.width - frame.height) / 2,
              top: (frame.height - frame.width) / 2,
              transform: [{ rotate: '90deg' }],
            })
          : null
      ) : (
        image(StyleSheet.absoluteFill)
      )}
    </View>
  );
}

export function isLandscapeCard(types: readonly string[]): boolean {
  return types.includes('battlefield');
}

const styles = StyleSheet.create({
  frame: { width: '100%', overflow: 'hidden' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
