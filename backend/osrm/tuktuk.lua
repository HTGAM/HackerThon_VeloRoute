-- VeloRoute Vientiane: OSRM Custom Profile for Tuk-Tuks and Rainy-Season Motorcycles
-- Architecture Focus: Penalizes unpaved roads (surface=unpaved/ground) which turn to mud traps in Vientiane's wet season.

api_version = 4

-- Set speed limits for Tuk-Tuks (max speed around 30-40 km/h)
local default_speeds = {
  motorway = 40,
  trunk = 40,
  primary = 35,
  secondary = 30,
  tertiary = 25,
  unclassified = 20,
  residential = 15,
  living_street = 10,
  service = 10
}

function camelcase_to_underscore(s)
  return string.gsub(s, "%f[%u]%u", function(c) return "_" .. string.lower(c) end)
end

function setup()
  return {
    properties = {
      max_speed_for_map_matching      = 60/3600, -- km/s
      use_turn_costs                  = true,
      forward_default_speed           = 25,
      backward_default_speed          = 25,
      weight_name                     = 'duration',
      left_hand_traffic               = false -- Laos drives on the right side
    },
    default_speeds = default_speeds
  }
end

-- Process Node: check if node is barrier or restriction (standard OSRM setup)
function process_node(profile, node, result)
  -- Default access
  result.barrier = false
end

-- Process Way: determines routing speed, weight, and accessibility of segments
function process_way(profile, way, result)
  -- Identify highway tag
  local highway = way:get_value_by_key("highway")
  if not highway then
    return
  end

  -- Determine base speed based on road classification
  local speed = profile.default_speeds[highway] or 15

  -- Inspect surface tag for Vientiane's unpaved road conditions
  local surface = way:get_value_by_key("surface")
  local surface_penalty = 1.0

  if surface then
    -- surface=unpaved, surface=ground, surface=dirt are highly dangerous/unstable during floods and heavy monsoons
    if surface == "unpaved" or surface == "ground" or surface == "dirt" or surface == "mud" or surface == "sand" or surface == "gravel" then
      -- RATIONALE: Tuk-tuks have low clearance, three wheels, and poor suspension.
      -- During the rainy season, unpaved roads turn into deep mud, causing vehicle damage or stranding.
      -- We reduce the routing speed by 85%, making these segments highly unfavorable.
      surface_penalty = 0.15
    elseif surface == "cobblestone" or surface == "paving_stones" then
      -- Moderate penalty for rough paved roads
      surface_penalty = 0.60
    end
  else
    -- Default to a slight penalty if the road is minor and surface is unspecified,
    -- as many tertiary/residential roads in peripheral Vientiane remain unpaved.
    if highway == "residential" or highway == "service" or highway == "living_street" then
      surface_penalty = 0.80
    end
  end

  -- Apply surface penalty to the speed calculation
  local final_speed = speed * surface_penalty

  -- Set forward/backward speed and routing weight
  result.forward_speed = final_speed
  result.backward_speed = final_speed
  
  result.forward_rate = final_speed / 3.6
  result.backward_rate = final_speed / 3.6

  -- Standard vehicle access rules (ensure it's not restricted to pedestrians)
  result.forward_mode = mode.driving
  result.backward_mode = mode.driving
end

-- Turn cost calculation
function process_turn(profile, turn)
  turn.duration = 2.0 -- basic turn cost (in seconds) to account for traffic slowdowns
  turn.weight = 2.0
end
