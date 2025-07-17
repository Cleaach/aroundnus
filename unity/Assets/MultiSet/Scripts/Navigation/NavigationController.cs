using UnityEngine;
using UnityEngine.AI;
using UnityEngine.Events;
using System.IO;

/**
 * Handles the agent and other controllers to navigate a user in AR to a selected destination.
 */
public class NavigationController : MonoBehaviour
{
    public static NavigationController instance;

    private Camera ARCamera;

    // collider of the ARCamera to detect POI arrival
    private SphereCollider ARCameraCollider;

    [Tooltip("NavMesh agent child of ARCamera")]
    public NavMeshAgent agent;

    [Tooltip("Current POI for navigation")]
    public POI currentDestination;

    [Tooltip("Space that contains POIs")]
    public AugmentedSpace augmentedSpace;

    // Position tracking to reduce unnecessary updates
    private Vector3 lastAgentPosition;
    [Tooltip("Minimum distance the agent needs to move before updating path")]
    public float positionUpdateThreshold = 0.5f; // in meters
    public UnityEvent DestinationArrived = new UnityEvent();


    void Awake()
    {
        instance = this;
        ARCamera = Camera.main;
        Debug.Log("Awake: NavigationController initialized");
    }

    void Start()
    {
        ARCameraCollider = ARCamera.GetComponent<SphereCollider>();
        if (currentDestination)
        {
            Debug.Log("Start: currentDestination exists, calling StartNavigation");
            StartNavigation();
        }
        lastAgentPosition = agent.transform.position;
        Debug.Log("Start: lastAgentPosition set to " + lastAgentPosition);
    }

    void SendUnityReadyMessage()
    {
#if UNITY_ANDROID
        using (AndroidJavaClass jc = new AndroidJavaClass("com.azesmway.reactnativeunity.ReactNativeUnityView"))
        {
            jc.CallStatic("sendMessageToMobileApp", "UnityReady");
        }
#elif UNITY_IOS
        NativeCallProxy.SendMessageToMobileApp("UnityReady");
#endif
    }

    void Update()
    {
        Debug.Log("Update: agent.isOnNavMesh=" + agent.isOnNavMesh + ", IsCurrentlyNavigating=" + IsCurrentlyNavigating());
        if (agent.isOnNavMesh)
        {
            // stopped the NavMesh agent to walk to destination
            agent.isStopped = true;
        }

        if (IsCurrentlyNavigating() && agent.isOnNavMesh)
        {
            agent.destination = currentDestination.poiCollider.transform.position;

            // Only update the path starting position if we've moved enough
            float distanceMoved = Vector3.Distance(agent.transform.position, lastAgentPosition);
            Debug.Log($"Update: Navigating to {currentDestination.name}, distanceMoved={distanceMoved}");
            if (distanceMoved > positionUpdateThreshold)
            {
                lastAgentPosition = agent.transform.position;
                // when we are navigating and we are localized path needs to go from current agent position
                ShowPath.instance.SetPositionFrom(agent.transform);
                Debug.Log("Update: Path updated from agent position");
            }

            // enable collider to detect arrival
            ARCameraCollider.enabled = true;
        }
        else
        {
            ARCameraCollider.enabled = false;
        }
    }

    // Sets a POI for navigation and gets ready for navigation.
    public void SetPOIForNavigation(POI aPOI)
    {
        Debug.Log("SetPOIForNavigation: " + (aPOI != null ? aPOI.name : "null"));
        currentDestination = aPOI;
        StartNavigation();
    }

    // Sets positions for ShowPath to start navigation.
    void StartNavigation()
    {
        if (agent == null)
        {
            Debug.LogError("StartNavigation: agent is NULL!");
            return;
        }
        if (currentDestination == null)
        {
            Debug.LogError("StartNavigation: currentDestination is NULL!");
            return;
        }
        if (currentDestination.poiCollider == null)
        {
            Debug.LogError("StartNavigation: currentDestination.poiCollider is NULL!");
            return;
        }
        if (ShowPath.instance == null)
        {
            Debug.LogError("StartNavigation: ShowPath.instance is NULL!");
            return;
        }

        lastAgentPosition = agent.transform.position;
        Debug.Log("StartNavigation: lastAgentPosition set to " + lastAgentPosition);
        ShowPath.instance.SetPositionFrom(agent.transform);
        ShowPath.instance.SetPositionTo(currentDestination.poiCollider.transform);
        Debug.Log("StartNavigation: Path set from agent to " + currentDestination.poiCollider.transform.position);
    }

    // Stops navigation.
    public void StopNavigation()
    {
        Debug.Log("StopNavigation: called");
        if (currentDestination != null)
        {
            Debug.Log("StopNavigation: currentDestination was " + currentDestination.name);
            currentDestination = null;
            ShowPath.instance.ResetPath();
            PathEstimationUtils.instance.ResetEstimation();
            Debug.Log("StopNavigation: Path and estimation reset");
        }
    }

    // Handles destination arrival. Is called from POI.Arrived()
    public void ArrivedAtDestination()
    {
        Debug.Log("ArrivedAtDestination: called");
        DestinationArrived.Invoke();
        StopNavigation();
        NavigationUIController.instance.ShowArrivedState();
    }

    //Returns true when user is currently navigating.
    public bool IsCurrentlyNavigating()
    {
        bool navigating = currentDestination != null;
        Debug.Log("IsCurrentlyNavigating: " + navigating);
        return navigating;
    }

    //Toggles the nav mesh agent capsule visibility
    public void ToggleAgentVisibility()
    {
        bool newState = !agent.gameObject.GetComponent<MeshRenderer>().enabled;
        agent.gameObject.GetComponent<MeshRenderer>().enabled = newState;
        Debug.Log("ToggleAgentVisibility: MeshRenderer enabled set to " + newState);
    }

    // Start navigation to a POI by name, called from React Native
    public void StartNavigationToPOI(string poiName)
    {
        string logPath = Path.Combine(Application.persistentDataPath, "POI_Navigation_Log.txt");
        string logEntry = System.DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + " - StartNavigationToPOI called with NAH INI BISA: " + poiName + "\n";
        File.AppendAllText(logPath, logEntry);

        Debug.Log("StartNavigationToPOI called with: " + poiName);
        POI foundPOI = FindPOI(poiName);
        if (foundPOI != null)
        {
            Debug.Log("StartNavigationToPOI: POI found: " + foundPOI.name);
            NavigationController.instance.SetPOIForNavigation(foundPOI);
            Debug.Log("StartNavigationToPOI: Navigation started to: " + foundPOI.name);
        }
        else
        {
            Debug.LogWarning("POI not found: " + poiName);
        }
    }

    private POI FindPOI(string destinationName)
    {
        Debug.Log("FindPOI: searching for " + destinationName);
        if (augmentedSpace != null && augmentedSpace.pois != null)
        {
            foreach (var poi in augmentedSpace.pois)
            {
                if (poi != null && poi.name == destinationName)
                {
                    Debug.Log("FindPOI: found " + poi.name);
                    return poi;
                }
            }
        }
        Debug.Log("FindPOI: not found " + destinationName);
        return null;
    }

    public void ResetNavigation()
    {
        Debug.Log("ResetNavigation: called");
        NavigationController.instance.StopNavigation();
        Debug.Log("ResetNavigation: navigation reset");
        Debug.Log("Navigation reset via ResetNavigation()");
    }
}