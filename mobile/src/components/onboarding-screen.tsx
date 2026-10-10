import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

type OnboardingSlide = {
  id: string;
  title: string;
  description: string;
  visual: 'parts' | 'order' | 'fulfillment';
};

const slides: OnboardingSlide[] = [
  {
    id: 'parts',
    title: 'Find the Right Parts',
    description:
      'Browse genuine and compatible motorcycle parts for Honda, Yamaha, and Suzuki.',
    visual: 'parts',
  },
  {
    id: 'order',
    title: 'Order With Ease',
    description:
      'Add the parts you need to your cart and submit your order request directly from your phone.',
    visual: 'order',
  },
  {
    id: 'fulfillment',
    title: 'Pickup or Delivery',
    description:
      'Choose store pickup or Lalamove delivery for your confirmed order.',
    visual: 'fulfillment',
  },
];

type MobileOnboardingOverlayProps = {
  onComplete?: () => void;
};

export function MobileOnboardingOverlay({
  onComplete,
}: MobileOnboardingOverlayProps) {
  const { width } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isLastSlide = activeIndex === slides.length - 1;

  const moveToSlide = useCallback(
    (index: number) => {
      scrollViewRef.current?.scrollTo({
        animated: true,
        x: index * width,
      });
      setActiveIndex(index);
    },
    [width],
  );

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
      setActiveIndex(Math.min(Math.max(nextIndex, 0), slides.length - 1));
    },
    [width],
  );

  const handlePrimaryAction = () => {
    if (isLastSlide) {
      onComplete?.();
      return;
    }

    moveToSlide(activeIndex + 1);
  };

  return (
    <View
      accessibilityViewIsModal
      style={styles.overlay}
    >
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerBrand}>ALD MOTORSHOP</Text>

          {!isLastSlide ? (
            <Pressable
              accessibilityLabel="Skip introduction"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onComplete}
              style={({ pressed }) => [
                styles.skipButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          ref={scrollViewRef}
          accessibilityLabel="ALD Motorshop introduction"
          contentContainerStyle={styles.slidesContent}
          horizontal
          onMomentumScrollEnd={handleScrollEnd}
          pagingEnabled
          showsHorizontalScrollIndicator={false}
        >
          {slides.map((slide, index) => (
            <View
              key={slide.id}
              accessible
              accessibilityLabel={`${slide.title}. Step ${index + 1} of ${slides.length}. ${slide.description}`}
              style={[styles.slide, { width }]}
            >
              <SlideVisual type={slide.visual} />

              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideDescription}>{slide.description}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.controls}>
          <View
            accessibilityLabel={`Step ${activeIndex + 1} of ${slides.length}`}
            style={styles.indicatorRow}
          >
            {slides.map((slide, index) => (
              <View
                key={slide.id}
                accessibilityLabel={`Step ${index + 1}${index === activeIndex ? ', current' : ''}`}
                accessibilityRole="tab"
                accessibilityState={{ selected: index === activeIndex }}
                style={[
                  styles.indicator,
                  index === activeIndex && styles.activeIndicator,
                ]}
              />
            ))}
          </View>

          <Pressable
            accessibilityLabel={isLastSlide ? 'Get Started' : 'Next slide'}
            accessibilityRole="button"
            onPress={handlePrimaryAction}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {isLastSlide ? 'Get Started' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function SlideVisual({ type }: { type: OnboardingSlide['visual'] }) {
  if (type === 'parts') {
    return (
      <View style={[styles.visualFrame, styles.partsVisual]}>
        <View style={styles.visualHeader}>
          <View style={styles.visualHeaderDot} />
          <Text style={styles.visualHeaderText}>Compatible parts</Text>
        </View>

        <View style={styles.brandGrid}>
          {['Honda', 'Yamaha', 'Suzuki'].map((brand) => (
            <View key={brand} style={styles.brandTile}>
              <Text style={styles.brandTileInitial}>{brand.charAt(0)}</Text>
              <Text style={styles.brandTileText}>{brand}</Text>
            </View>
          ))}
        </View>

        <View style={styles.visualLineShort} />
        <View style={styles.visualLineLong} />
      </View>
    );
  }

  if (type === 'order') {
    return (
      <View style={[styles.visualFrame, styles.orderVisual]}>
        <View style={styles.orderVisualTop}>
          <Text style={styles.orderVisualTitle}>Order request</Text>
          <Text style={styles.orderVisualStatus}>Review</Text>
        </View>

        {['Brake pad set', 'Oil filter'].map((item, index) => (
          <View key={item} style={styles.orderRow}>
            <View style={styles.orderRowNumber}>
              <Text style={styles.orderRowNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.orderRowText}>{item}</Text>
            <View style={styles.orderRowCheck}>
              <Text style={styles.orderRowCheckText}>✓</Text>
            </View>
          </View>
        ))}

        <View style={styles.orderTotalRow}>
          <Text style={styles.orderTotalLabel}>Ready to submit</Text>
          <View style={styles.orderTotalAccent} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.visualFrame, styles.fulfillmentVisual]}>
      <Text style={styles.fulfillmentTitle}>Choose fulfillment</Text>

      <View style={styles.fulfillmentOptionSelected}>
        <View style={styles.fulfillmentIconPickup} />
        <View>
          <Text style={styles.fulfillmentOptionTitle}>Store Pickup</Text>
          <Text style={styles.fulfillmentOptionDetail}>Choose your branch</Text>
        </View>
      </View>

      <View style={styles.fulfillmentOption}>
        <View style={styles.fulfillmentIconDelivery} />
        <View>
          <Text style={styles.fulfillmentOptionTitle}>Lalamove Delivery</Text>
          <Text style={styles.fulfillmentOptionDetail}>After confirmation</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.light.background,
    zIndex: 900,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: Spacing.four,
  },
  headerBrand: {
    color: Colors.light.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 64,
  },
  skipText: {
    color: Colors.light.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.6,
  },
  slidesContent: {
    flexGrow: 1,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  visualFrame: {
    borderColor: '#E2E8F0',
    borderRadius: 24,
    borderWidth: 1,
    height: 224,
    justifyContent: 'center',
    marginBottom: Spacing.four,
    maxWidth: 344,
    padding: Spacing.four,
    shadowColor: '#0F172A',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    width: '100%',
  },
  partsVisual: {
    backgroundColor: '#FFF7ED',
  },
  visualHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  visualHeaderDot: {
    backgroundColor: Colors.light.primary,
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  visualHeaderText: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '700',
  },
  brandGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  brandTile: {
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundElement,
    borderColor: '#FED7AA',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: Spacing.one,
    paddingVertical: Spacing.three,
  },
  brandTileInitial: {
    color: Colors.light.primary,
    fontSize: 26,
    fontWeight: '800',
  },
  brandTileText: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  visualLineShort: {
    backgroundColor: '#FDBA74',
    borderRadius: 3,
    height: 6,
    marginTop: Spacing.four,
    width: '38%',
  },
  visualLineLong: {
    backgroundColor: '#FED7AA',
    borderRadius: 3,
    height: 6,
    marginTop: Spacing.two,
    width: '76%',
  },
  orderVisual: {
    backgroundColor: Colors.light.backgroundElement,
  },
  orderVisualTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  orderVisualTitle: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '800',
  },
  orderVisualStatus: {
    color: Colors.light.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  orderRow: {
    alignItems: 'center',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  orderRowNumber: {
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  orderRowNumberText: {
    color: Colors.light.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  orderRowText: {
    color: Colors.light.textSecondary,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  orderRowCheck: {
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  orderRowCheckText: {
    color: Colors.light.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  orderTotalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
  },
  orderTotalLabel: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: '700',
  },
  orderTotalAccent: {
    backgroundColor: Colors.light.primary,
    borderRadius: 3,
    height: 7,
    width: 68,
  },
  fulfillmentVisual: {
    backgroundColor: '#F8FAFC',
  },
  fulfillmentTitle: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: Spacing.three,
  },
  fulfillmentOption: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  fulfillmentOptionSelected: {
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  fulfillmentIconPickup: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    height: 16,
    width: 16,
  },
  fulfillmentIconDelivery: {
    backgroundColor: '#CBD5E1',
    borderRadius: 8,
    height: 16,
    width: 16,
  },
  fulfillmentOptionTitle: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '700',
  },
  fulfillmentOptionDetail: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  slideTitle: {
    color: Colors.light.text,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    textAlign: 'center',
  },
  slideDescription: {
    color: Colors.light.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginTop: Spacing.two,
    maxWidth: 340,
    textAlign: 'center',
  },
  controls: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
    paddingTop: Spacing.three,
  },
  indicatorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  indicator: {
    backgroundColor: '#CBD5E1',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  activeIndicator: {
    backgroundColor: Colors.light.primary,
    width: 26,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 52,
    width: '100%',
  },
  primaryButtonPressed: {
    backgroundColor: '#B95F00',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
