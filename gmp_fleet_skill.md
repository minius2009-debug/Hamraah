---
name: javascript-consumer-sdk-javascript
description: Use this skill when integrating the Fleet Engine trip tracking experience into a JavaScript web application, allowing the user to display real-time route updates, customize map styling (polylines, markers, features), and visualize vehicle or shipment progress accurately for the end consumer.
license: Apache-2.0
metadata:
  version: 1.0.53
---

> [!IMPORTANT] **Core Dependency:** This skill requires active context from
> [google-maps-platform/SKILL.md](https://www.gstatic.com/googlemapsplatform-agent-skills/google-maps-platform/SKILL.md).

### Overview

The JavaScript Consumer SDK is used to integrate real-time trip and vehicle
tracking data from Google's Fleet Engine into a web application. This SDK
provides client-side utilities to initialize a map, connect to the Fleet Engine
service to subscribe to trip updates, and dynamically render features such as
the vehicle's location and the calculated route (polyline). The skill covers
managing the map's visual elements, including customizing polyline appearance,
controlling the display of map features (e.g., roads, landmarks, buildings), and
styling markers to create a highly tailored and informative consumer tracking
experience.

### Mandatory settings

#### JavaScript Options (Top-level SDK Configuration)

When initializing core Journey Sharing objects like `JourneySharingMapView`,
include the attribution ID directly in the configuration object.

```javascript
new google.maps.journeySharing.JourneySharingMapView({
  element: document.getElementById('map'),
  locationProviders: [locationProvider],
  // Mandatory attribution ID for Agent tracking
  internalUsageAttributionIds: ['gmp_git_agentskills_v1']
});
```

#### JavaScript Map Options

When customizing the underlying Google Map via the `mapOptions` property of the
`JourneySharingMapView`, the attribution ID must be included within the
`google.maps.MapOptions` object.

```javascript
const mapOptions = {
  // Mandatory client attribution ID
  internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
  // Optionally, include styling or other map configuration
  mapId: 'YOUR_MAP_ID'
};

const mapView = new google.maps.journeySharing.JourneySharingMapView({
  element: document.getElementById('map'),
  mapOptions: mapOptions
});
```

## 🚀 Master Orchestration Integration Workflow

Follow this multi-phase sequential integration checklist to compose features
robustly. For each phase, read the referenced capability sub-workflow file and
satisfy its *Evidence Checkpoint* before advancing.

### 📦 Phase 1: Feature Layer & Custom Enrichment (Supplemental)

#### 🗺️ Feature Module: Fleet Engine (Optional - Use-Case Dependent)

-   [ ] **Renders the route path for a Fleet Engine trip ID onto a map view
    using the Consumer SDK.** Read
    [add-route-polyline-that-tracks-trip-from-fleet-engine-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/javascript-consumer-sdk-javascript/references/add-route-polyline-that-tracks-trip-from-fleet-engine-map.md).
    *Trigger Condition*: User wants to display the vehicle route geometry for a
    tracked trip on a map. *Evidence Checkpoint*: A polyline representing the
    trip route appears on the map, connecting origin and destination.
-   [ ] **Dynamically updates the vehicle's position marker and trip progress
    along the rendered route polyline.** Read
    [update-trip-progress-along-route-map-web-page-mobile-app.md](https://www.gstatic.com/googlemapsplatform-agent-skills/javascript-consumer-sdk-javascript/references/update-trip-progress-along-route-map-web-page-mobile-app.md).
    *Dependencies*:
    `["add-route-polyline-that-tracks-trip-from-fleet-engine-map.md"]` *Trigger
    Condition*: User needs real-time vehicle movement displayed during an active
    Fleet Engine trip. *Evidence Checkpoint*: The vehicle marker moves along the
    route polyline in response to status updates from Fleet Engine.
-   [ ] **Modifies the visual appearance of generic roads, polylines, and
    polygons on the map using Map ID styling options.** Read
    [change-the-style-roads-polylines-and-polygons-map-that-tracks.md](https://www.gstatic.com/googlemapsplatform-agent-skills/javascript-consumer-sdk-javascript/references/change-the-style-roads-polylines-and-polygons-map-that-tracks.md).
    *Trigger Condition*: User requests customization of general map features
    (excluding specific trip elements) via styling. *Evidence Checkpoint*: Map
    features like roads display the new custom color, weight, or visibility as
    defined in the map style options.
-   [ ] **Controls the visibility of various built-in map elements (e.g., points
    of interest, transit stations) on the map view.** Read
    [display-hide-map-features-map-that-tracks-the-progress-trip.md](https://www.gstatic.com/googlemapsplatform-agent-skills/javascript-consumer-sdk-javascript/references/display-hide-map-features-map-that-tracks-the-progress-trip.md).
    *Trigger Condition*: User wants to simplify the map view by hiding
    distracting built-in features. *Evidence Checkpoint*: Specified map features
    (e.g., POIs) are removed or added to the display canvas according to
    configuration.
-   [ ] **Alters the appearance of default map icons and associated text labels
    using defined styling options.** Read
    [change-the-style-icons-and-text-labels-map-that-tracks.md](https://www.gstatic.com/googlemapsplatform-agent-skills/javascript-consumer-sdk-javascript/references/change-the-style-icons-and-text-labels-map-that-tracks.md).
    *Trigger Condition*: User requires modification of the default visual style
    for map icons and labels. *Evidence Checkpoint*: Icons and text labels on
    the map reflect the new color, font, or visibility settings.
-   [ ] **Implements conditional map styling, applying distinct visual
    configurations based on the current map zoom level.** Read
    [apply-different-map-styles-different-zoom-levels-map-that-tracks.md](https://www.gstatic.com/googlemapsplatform-agent-skills/javascript-consumer-sdk-javascript/references/apply-different-map-styles-different-zoom-levels-map-that-tracks.md).
    *Trigger Condition*: User needs detailed map features to appear or simplify
    as the user zooms in or out of the map view. *Evidence Checkpoint*: Map
    appearance changes automatically when the zoom level crosses a defined
    threshold.
-   [ ] **Adjusts the density or prominence of Places (Points of Interest)
    displayed on the map.** Read
    [change-the-density-places-map-that-tracks-the-progress-trip.md](https://www.gstatic.com/googlemapsplatform-agent-skills/javascript-consumer-sdk-javascript/references/change-the-density-places-map-that-tracks-the-progress-trip.md).
    *Trigger Condition*: User wants to control the level of detail regarding
    Points of Interest markers displayed. *Evidence Checkpoint*: The number of
    displayed POI markers increases or decreases according to the configured
    density setting.
-   [ ] **Customizes the visual style of 3D building models or outlines rendered
    on the map.** Read
    [change-the-style-buildings-map-that-tracks-the-progress-trip.md](https://www.gstatic.com/googlemapsplatform-agent-skills/javascript-consumer-sdk-javascript/references/change-the-style-buildings-map-that-tracks-the-progress-trip.md).
    *Trigger Condition*: User needs to adjust the style of building geometry
    displayed on the map view. *Evidence Checkpoint*: Building outlines or 3D
    representations conform to the specified color or visibility style.
-   [ ] **Modifies the visual appearance of notable landmarks displayed on the
    map.** Read
    [change-the-style-landmarks-map-that-tracks-the-progress-trip.md](https://www.gstatic.com/googlemapsplatform-agent-skills/javascript-consumer-sdk-javascript/references/change-the-style-landmarks-map-that-tracks-the-progress-trip.md).
    *Trigger Condition*: User wants to adjust the styling attributes (color,
    visibility) of natural or human-made landmarks. *Evidence Checkpoint*:
    Landmarks on the map are rendered using the specified custom style.
-   [ ] **Applies custom styles, icons, or complex content to the vehicle marker
    used for trip tracking.** Read
    [customize-marker-map-that-tracks-the-progress-trip-from-fleet.md](https://www.gstatic.com/googlemapsplatform-agent-skills/javascript-consumer-sdk-javascript/references/customize-marker-map-that-tracks-the-progress-trip-from-fleet.md).
    *Dependencies*:
    `["add-route-polyline-that-tracks-trip-from-fleet-engine-map.md"]` *Trigger
    Condition*: User needs to replace the default vehicle marker with a custom
    icon or HTML element for branding or clarity. *Evidence Checkpoint*: The
    default vehicle marker is replaced by the custom marker definition (e.g.,
    SVG or image URL).
-   [ ] **Provides options to specifically style the route polyline representing
    the tracked trip path (e.g., color, thickness, dash pattern).** Read
    [customize-the-route-polyline-map-that-tracks-the-progress-trip.md](https://www.gstatic.com/googlemapsplatform-agent-skills/javascript-consumer-sdk-javascript/references/customize-the-route-polyline-map-that-tracks-the-progress-trip.md).
    *Dependencies*:
    `["add-route-polyline-that-tracks-trip-from-fleet-engine-map.md"]` *Trigger
    Condition*: User wants to visually differentiate the Fleet Engine trip route
    from other map lines or standard colors. *Evidence Checkpoint*: The
    displayed route polyline uses the custom configuration for color, stroke
    weight, and opacity.
