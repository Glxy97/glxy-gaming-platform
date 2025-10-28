/**
 * GLXY Gaming Platform - Advanced Shader Library
 * Custom GLSL shaders for high-quality 3D rendering
 */

import * as THREE from 'three'

export const vertexShaders = {
  // Standard PBR vertex shader with normal mapping
  standardPBR: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;
    varying vec3 vTangent;
    varying vec3 vBitangent;

    uniform mat4 modelMatrix;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat3 normalMatrix;

    attribute vec2 uv;
    attribute vec3 normal;
    attribute vec3 position;
    attribute vec4 tangent;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      vViewPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;

      // Calculate tangent space
      vTangent = normalize(normalMatrix * tangent.xyz);
      vBitangent = normalize(cross(vNormal, vTangent) * tangent.w);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  // Animated vertex shader for character models
  animated: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    uniform mat4 modelMatrix;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat3 normalMatrix;
    uniform float time;

    attribute vec2 uv;
    attribute vec3 normal;
    attribute vec3 position;

    // Noise function for animation
    float noise(vec3 p) {
      return sin(p.x * 10.0 + time) * sin(p.y * 10.0 + time) * sin(p.z * 10.0 + time) * 0.1;
    }

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);

      // Add wave animation
      vec3 animatedPosition = position + normal * noise(position);

      vWorldPosition = (modelMatrix * vec4(animatedPosition, 1.0)).xyz;
      vViewPosition = (modelViewMatrix * vec4(animatedPosition, 1.0)).xyz;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(animatedPosition, 1.0);
    }
  `,

  // Terrain vertex shader with height-based coloring
  terrain: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vHeight;
    varying float vSlope;

    uniform mat4 modelMatrix;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat3 normalMatrix;

    attribute vec2 uv;
    attribute vec3 normal;
    attribute vec3 position;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      vHeight = position.y;
      vSlope = 1.0 - abs(vNormal.y);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `
}

export const fragmentShaders = {
  // Physically-Based Rendering (PBR) fragment shader
  standardPBR: `
    uniform vec3 albedo;
    uniform float metallic;
    uniform float roughness;
    uniform float ao;
    uniform vec3 emissive;
    uniform float opacity;

    uniform vec3 lightPositions[4];
    uniform vec3 lightColors[4];
    uniform vec3 cameraPos;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    const float PI = 3.14159265359;

    // Distribution function (GGX)
    float distributionGGX(vec3 N, vec3 H, float roughness) {
      float a = roughness * roughness;
      float a2 = a * a;
      float NdotH = max(dot(N, H), 0.0);
      float NdotH2 = NdotH * NdotH;
      float num = a2;
      float denom = (NdotH2 * (a2 - 1.0) + 1.0);
      denom = PI * denom * denom;
      return num / denom;
    }

    // Geometry function (Smith)
    float geometrySchlickGGX(float NdotV, float roughness) {
      float r = (roughness + 1.0);
      float k = (r * r) / 8.0;
      float num = NdotV;
      float denom = NdotV * (1.0 - k) + k;
      return num / denom;
    }

    float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
      float NdotV = max(dot(N, V), 0.0);
      float NdotL = max(dot(N, L), 0.0);
      float ggx2 = geometrySchlickGGX(NdotV, roughness);
      float ggx1 = geometrySchlickGGX(NdotL, roughness);
      return ggx1 * ggx2;
    }

    // Fresnel function (Fresnel-Schlick)
    vec3 fresnelSchlick(float cosTheta, vec3 F0) {
      return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
    }

    void main() {
      vec3 N = normalize(vNormal);
      vec3 V = normalize(cameraPos - vWorldPosition);
      vec3 R = reflect(-V, N);

      // Calculate reflectance at normal incidence
      vec3 F0 = vec3(0.04);
      F0 = mix(F0, albedo, metallic);

      // Light calculations
      vec3 Lo = vec3(0.0);
      for(int i = 0; i < 4; ++i) {
        vec3 L = normalize(lightPositions[i] - vWorldPosition);
        vec3 H = normalize(V + L);
        float distance = length(lightPositions[i] - vWorldPosition);
        float attenuation = 1.0 / (distance * distance);
        vec3 radiance = lightColors[i] * attenuation;

        // Cook-Torrance BRDF
        float NDF = distributionGGX(N, H, roughness);
        float G = geometrySmith(N, V, L, roughness);
        vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metallic;

        vec3 numerator = NDF * G * F;
        float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
        vec3 specular = numerator / denominator;

        float NdotL = max(dot(N, L), 0.0);
        Lo += (kD * albedo / PI + specular) * radiance * NdotL;
      }

      // Ambient lighting
      vec3 ambient = vec3(0.03) * albedo * ao;
      vec3 color = ambient + Lo;

      // HDR tonemapping
      color = color / (color + vec3(1.0));

      // Gamma correction
      color = pow(color, vec3(1.0/2.2));

      gl_FragColor = vec4(color, opacity);
    }
  `,

  // Glass/transparent shader with refraction
  glass: `
    uniform vec3 albedo;
    uniform float roughness;
    uniform float ior;
    uniform float opacity;

    uniform vec3 lightPositions[4];
    uniform vec3 lightColors[4];
    uniform samplerCube environmentMap;
    uniform vec3 cameraPos;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    const float PI = 3.14159265359;

    void main() {
      vec3 N = normalize(vNormal);
      vec3 V = normalize(cameraPos - vWorldPosition);
      vec3 R = reflect(-V, N);

      // Calculate refraction
      float ratio = 1.00 / ior;
      vec3 Rrefract = refract(-V, N, ratio);

      // Mix reflection and refraction based on fresnel
      float fresnel = pow(1.0 - dot(V, N), 2.0);

      vec3 reflectedColor = texture(environmentMap, R).rgb;
      vec3 refractedColor = texture(environmentMap, Rrefract).rgb;

      vec3 color = mix(refractedColor, reflectedColor, fresnel) * albedo;

      // Add some lighting
      vec3 lightContribution = vec3(0.0);
      for(int i = 0; i < 4; ++i) {
        vec3 L = normalize(lightPositions[i] - vWorldPosition);
        float distance = length(lightPositions[i] - vWorldPosition);
        float attenuation = 1.0 / (distance * distance);
        lightContribution += lightColors[i] * attenuation * max(dot(N, L), 0.0);
      }

      color += lightContribution * 0.1;

      gl_FragColor = vec4(color, opacity);
    }
  `,

  // Holographic shader with rainbow effect
  hologram: `
    uniform float time;
    uniform vec3 baseColor;
    uniform float opacity;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    const float PI = 3.14159265359;

    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
      // Create scanning lines effect
      float scanline = sin(vUv.y * 50.0 + time * 2.0) * 0.5 + 0.5;

      // Create rainbow hologram effect
      float hue = fract(vUv.x + vUv.y + time * 0.5);
      vec3 rainbowColor = hsv2rgb(vec3(hue, 0.8, 1.0));

      // Mix with base color
      vec3 color = mix(baseColor, rainbowColor, 0.6);
      color *= scanline;

      // Add edge glow
      vec3 viewDir = normalize(cameraPos - vWorldPosition);
      float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);
      color += rainbowColor * fresnel * 0.5;

      gl_FragColor = vec4(color, opacity * (0.3 + scanline * 0.7));
    }
  `,

  // Animated lava/fire shader
  lava: `
    uniform float time;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    // 3D noise function
    float noise(vec3 p) {
      return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
    }

    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;

      for(int i = 0; i < 6; i++) {
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      // Create animated noise
      vec3 p = vWorldPosition * 0.1 + vec3(time * 0.2);
      float noiseValue = fbm(p);

      // Animate the noise
      noiseValue += sin(time + vWorldPosition.x * 0.5) * 0.1;
      noiseValue += cos(time * 1.3 + vWorldPosition.z * 0.3) * 0.1;

      // Create color based on noise
      vec3 color;
      if(noiseValue < 0.3) {
        color = mix(color1, color2, noiseValue / 0.3);
      } else if(noiseValue < 0.7) {
        color = mix(color2, color3, (noiseValue - 0.3) / 0.4);
      } else {
        color = color3;
      }

      // Add some glow
      float glow = pow(noiseValue, 2.0) * 2.0;
      color += glow * vec3(1.0, 0.5, 0.0);

      gl_FragColor = vec4(color, 1.0);
    }
  `,

  // Terrain shader with texturing based on height
  terrain: `
    uniform sampler2D grassTexture;
    uniform sampler2D rockTexture;
    uniform sampler2D snowTexture;
    uniform float snowLevel;
    uniform float rockLevel;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vHeight;
    varying float vSlope;

    void main() {
      // Calculate texture weights based on height and slope
      float grassWeight = 1.0 - smoothstep(rockLevel, snowLevel, vHeight);
      float rockWeight = smoothstep(rockLevel, rockLevel + 10.0, vHeight) + vSlope;
      rockWeight = clamp(rockWeight, 0.0, 1.0);
      float snowWeight = smoothstep(snowLevel, snowLevel + 20.0, vHeight);

      // Normalize weights
      float totalWeight = grassWeight + rockWeight + snowWeight;
      grassWeight /= totalWeight;
      rockWeight /= totalWeight;
      snowWeight /= totalWeight;

      // Sample textures
      vec4 grassColor = texture2D(grassTexture, vUv * 10.0);
      vec4 rockColor = texture2D(rockTexture, vUv * 8.0);
      vec4 snowColor = texture2D(snowTexture, vUv * 5.0);

      // Blend textures
      vec4 color = grassColor * grassWeight + rockColor * rockWeight + snowColor * snowWeight;

      // Add some lighting
      vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5));
      float diff = max(dot(vNormal, lightDir), 0.0);
      color.rgb *= (0.3 + 0.7 * diff);

      gl_FragColor = color;
    }
  `
}

export class ShaderManager {
  private static instance: ShaderManager
  private shaders: Map<string, THREE.ShaderMaterial> = new Map()

  static getInstance(): ShaderManager {
    if (!ShaderManager.instance) {
      ShaderManager.instance = new ShaderManager()
    }
    return ShaderManager.instance
  }

  public createCustomShader(
    name: string,
    vertexShader: string,
    fragmentShader: string,
    uniforms?: any
  ): THREE.ShaderMaterial {
    const material = new THREE.ShaderMaterial({
      uniforms: uniforms || {},
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      transparent: true
    })

    this.shaders.set(name, material)
    return material
  }

  public getShader(name: string): THREE.ShaderMaterial | undefined {
    return this.shaders.get(name)
  }

  public updateUniform(name: string, uniform: string, value: any): void {
    const shader = this.shaders.get(name)
    if (shader && shader.uniforms[uniform]) {
      shader.uniforms[uniform].value = value
    }
  }

  public dispose(): void {
    this.shaders.forEach(shader => shader.dispose())
    this.shaders.clear()
  }
}

export default {
  vertexShaders,
  fragmentShaders,
  ShaderManager
}